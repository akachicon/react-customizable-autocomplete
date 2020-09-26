import React, {
  useRef,
  useCallback,
  useEffect,
  useMemo,
  createElement,
} from 'react';
import useState from 'react-use-batched-state';

import type {
  Suggestion,
  SuggestionId,
  SuggestionList,
} from './hooks/use-suggestion-manager';
import type {
  OnQuerySignature,
  OnQueryBecomesObsoleteSignature,
  OnDataSignature,
} from './hooks/use-query-manager';
import type {
  ListComponent,
  MinCharsComponent,
  NoResultsComponent,
  ErrorComponent,
} from './hooks/use-suggestion-list';
import type { FormProps } from './hooks/use-form-props';

import useInput from './hooks/use-input';
import useInputWithTrigger from './hooks/use-input-with-trigger';
import useDebouncedInput from './hooks/use-debounced-input';
import useSuggestionManager from './hooks/use-suggestion-manager';
import useSubmitLocker from './hooks/use-submit-locker';
import useSuggestionList from './hooks/use-suggestion-list';
import useQueryManager from './hooks/use-query-manager';
import useKeyDown from './hooks/use-key-down';
import useFormProps from './hooks/use-form-props';

import { keys } from './constants';
import debug from './debug';

type OnSubmitSignature<D = unknown> = (
  args: {
    id: SuggestionId;
    query: string;
    suggestions: SuggestionList<D> | null;
  },
  event: React.FormEvent<HTMLFormElement>
) => void;

export type InputComponent = React.ComponentType<{
  inputProps: JSX.IntrinsicElements['input'];
  isFetching: boolean;
}>;

export type ListContainerComponent = React.ComponentType<{
  containerProps: {
    onMouseLeave: React.MouseEventHandler;
  };
  isFetching: boolean;
  isOpen: boolean;
}>;

export type Props<D = unknown> = {
  onQuery: OnQuerySignature<D>;
  onQueryBecomesObsolete?: OnQueryBecomesObsoleteSignature<D>;
  onSubmit: OnSubmitSignature<D>;
  formProps?: FormProps;
  preserveInputOnSubmit?: boolean;
  debounceMs?: number;
  minCharsRequired?: number;
  inputComponent: InputComponent;
  listContainerComponent: ListContainerComponent;
  listComponent: ListComponent<D>;
  minCharsComponent: MinCharsComponent;
  noResultsComponent: NoResultsComponent;
  errorComponent: ErrorComponent;
};

const { ARROW_UP, ARROW_DOWN, ESCAPE, ENTER } = keys;

export default function AutoCompleteSearch<D = unknown>({
  onQuery,
  onQueryBecomesObsolete,
  onSubmit: consumerOnSubmit,
  formProps: consumerFormProps,
  preserveInputOnSubmit = true,
  debounceMs = 150,
  minCharsRequired = 3,
  inputComponent: Input,
  listContainerComponent: ListContainerComponent,
  listComponent,
  minCharsComponent,
  noResultsComponent,
  errorComponent,
}: Props<D>): JSX.Element {
  debug.log('root it:', debug.updateIt('root'));

  const formRef = useRef<HTMLFormElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [focus, setFocus] = useState(false);

  const input = useInput();
  const perceivedInput = useInputWithTrigger();
  const debouncedInput = useDebouncedInput(input.value, debounceMs);
  const suggestionManager = useSuggestionManager<D>();
  const submitLocker = useSubmitLocker();

  const submitWithMouse = useCallback(
    function submitWithMouse(id: NonNullable<SuggestionId>) {
      // The locker state is listened by onMouseSubmit effect.
      // We do not fire 'submit' event here as we want to wait
      // until the input value is set.

      const shouldContinue = submitLocker.lock('mouse');
      const selectedSuggestion = suggestionManager.getSuggestionById(id);

      if (!shouldContinue) return;

      if (!selectedSuggestion) {
        submitLocker.release();
        return;
      }
      perceivedInput.value = selectedSuggestion.text;
    },
    [submitLocker, suggestionManager, perceivedInput]
  );

  const onMouseSelect = useCallback(
    function onMouseSelect(id: SuggestionId) {
      submitLocker.lastMouseId = id;
      suggestionManager.selectId(id);
    },
    [submitLocker, suggestionManager]
  );

  const suggestionList = useSuggestionList<D>({
    listComponent,
    minCharsComponent,
    noResultsComponent,
    errorComponent,
    gteMinChars: debouncedInput.value.length >= minCharsRequired,
    suggestionManagerState: suggestionManager.state,
    onSuggestionMouseDown: submitWithMouse,
    onSuggestionMouseOver: onMouseSelect,
  });

  const onQueryResponse = useCallback(
    function onQueryResponse(...args: Parameters<OnDataSignature<D>>) {
      const [error, data] = args;

      debug.log('onQueryResponse: selectId(null)');
      suggestionManager.selectId(null);

      debug.log('onQueryResponse: selectId(data)');
      suggestionManager.setSuggestions(data);

      debug.log('onQueryResponse: selectId(error)');
      suggestionList.setError(error);
    },
    [suggestionManager, suggestionList]
  );

  const queryManager = useQueryManager<D>({
    onQuery,
    onQueryBecomesObsolete,
    onData: onQueryResponse,
  });

  const blurInput = useCallback(function blurInput() {
    inputRef.current?.blur();
  }, []);

  const submitWithKeyboard = useCallback(
    function submitWithKeyboard() {
      const shouldContinue = submitLocker.lock('keyboard');

      if (shouldContinue) {
        formRef.current?.dispatchEvent(
          new Event('submit', { bubbles: true, cancelable: true })
        );
      }
    },
    [submitLocker]
  );

  const onKeyboardSelect = useCallback(
    function onKeyboardSelect(suggestion: Suggestion<D> | null) {
      if (suggestion) {
        submitLocker.lastKeyboardId = suggestion.id;
        perceivedInput.value = suggestion.text;
        return;
      }
      submitLocker.lastKeyboardId = null;
      perceivedInput.value = input.value;
    },
    [submitLocker, perceivedInput, input]
  );

  const selectPreviousSuggestion = useCallback(
    function selectPreviousSuggestion() {
      const previousSuggestion = suggestionManager.selectPrevious();
      onKeyboardSelect(previousSuggestion);
    },
    [suggestionManager, onKeyboardSelect]
  );

  const selectNextSuggestion = useCallback(
    function selectNextSuggestion() {
      const nextSuggestion = suggestionManager.selectNext();
      onKeyboardSelect(nextSuggestion);
    },
    [suggestionManager, onKeyboardSelect]
  );

  const keyMap = useMemo(
    function genKeyMap() {
      return {
        [ESCAPE]: blurInput,
        [ENTER]: submitWithKeyboard,
        [ARROW_UP]: selectPreviousSuggestion,
        [ARROW_DOWN]: selectNextSuggestion,
      };
    },
    [
      blurInput,
      submitWithKeyboard,
      selectPreviousSuggestion,
      selectNextSuggestion,
    ]
  );

  const onKeyDown = useKeyDown(keyMap);

  const onChange = useCallback(
    function onChange(e: React.ChangeEvent<HTMLInputElement>) {
      if (submitLocker.isLocked) {
        e.preventDefault();
        return;
      }
      const { value } = e.currentTarget;

      if (value.trim().length < minCharsRequired) {
        queryManager.disposeQueries();
      }
      submitLocker.lastKeyboardId = null;
      input.value = value;
      perceivedInput.value = value;
    },
    [minCharsRequired, submitLocker, queryManager, input, perceivedInput]
  );

  const onSubmit = useCallback(
    function onSubmit(e: React.FormEvent<HTMLFormElement>) {
      e.preventDefault();
      queryManager.disposeQueries();

      const id =
        submitLocker.getLockInitiator() === 'keyboard'
          ? submitLocker.lastKeyboardId
          : submitLocker.lastMouseId;

      consumerOnSubmit(
        {
          id,
          query: perceivedInput.value,
          suggestions: suggestionManager.state.suggestions,
        },
        e
      );

      submitLocker.release();
      submitLocker.lastKeyboardId = null;
      submitLocker.lastMouseId = null;

      suggestionManager.setSuggestions(null);
      suggestionManager.selectId(null);

      if (!preserveInputOnSubmit) {
        perceivedInput.value = '';
      }
      input.value = '';
      suggestionList.setError(false);
      inputRef.current?.blur();
    },
    [
      consumerOnSubmit,
      preserveInputOnSubmit,
      input,
      perceivedInput,
      submitLocker,
      suggestionManager,
      suggestionList,
      queryManager,
    ]
  );

  const onFocus = useCallback(function onFocus() {
    setFocus(true);
  }, []);

  const onBlur = useCallback(function onBlur() {
    setFocus(false);
  }, []);

  const formProps = useFormProps(consumerFormProps);

  const inputProps = useMemo(
    function inputProps() {
      return {
        ref: inputRef,
        value: perceivedInput.value,
        onChange: onChange,
        onFocus: onFocus,
        onBlur: onBlur,
        onKeyDown: onKeyDown,
        autoComplete: 'off',
      };
    },
    [inputRef, perceivedInput.value, onChange, onFocus, onBlur, onKeyDown]
  );

  const listContainerProps = useMemo(
    function inputProps() {
      return {
        onMouseLeave() {
          submitLocker.lastMouseId = null;
          suggestionManager.selectId(null);
        },
      };
    },
    [submitLocker, suggestionManager]
  );

  useEffect(
    function onMouseSubmit() {
      if (
        submitLocker.isLocked &&
        submitLocker.getLockInitiator() === 'mouse'
      ) {
        formRef.current?.dispatchEvent(
          new Event('submit', { bubbles: true, cancelable: true })
        );
      }
    },
    [submitLocker, perceivedInput.trigger]
  );

  useEffect(
    function validateAndPerformQuery() {
      console.log('query effect');
      const trimmedInput = debouncedInput.value.trim();

      if (trimmedInput.length >= minCharsRequired) {
        queryManager.performQuery(trimmedInput);
        return;
      }

      if (suggestionManager.state.suggestions !== null) {
        suggestionManager.setSuggestions(null);
        suggestionManager.selectId(null);
      }
      if (suggestionList.state.error) {
        suggestionList.setError(false);
      }
    },
    [
      minCharsRequired,
      debouncedInput.value,
      suggestionManager,
      queryManager,
      suggestionList,
    ]
  );

  const isFetching = queryManager.state.isFetching;
  let listElement;

  if ('props' in suggestionList.list) {
    listElement = createElement(
      suggestionList.list.component,
      suggestionList.list.props
    );
  } else {
    listElement = createElement(suggestionList.list.component);
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} {...formProps}>
      <Input inputProps={inputProps} isFetching={isFetching} />
      <ListContainerComponent
        containerProps={listContainerProps}
        isFetching={isFetching}
        isOpen={focus}
      >
        {listElement}
      </ListContainerComponent>
    </form>
  );
}
