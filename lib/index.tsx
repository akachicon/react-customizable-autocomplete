import React, {
  useRef,
  useCallback,
  useEffect,
  useMemo,
  createElement,
} from 'react';
import useState from 'react-use-batched-state';

import type { MutableRefObject } from 'react';
import type {
  Suggestion,
  SuggestionId,
  SuggestionListState,
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
import useIsFetching from './hooks/use-is-fetching';

import { keys } from './constants';
import debug from './debug';

export type OnSubmitSignature<D = unknown> = (
  args: {
    query: string;
    id: SuggestionId;
    suggestions: SuggestionListState<D> | null;
    resetInput: () => void;
  },
  event: React.FormEvent<HTMLFormElement>
) => void;

export type InputComponent<D = unknown> = React.ComponentType<{
  inputProps: Pick<
    JSX.IntrinsicElements['input'],
    'value' | 'onChange' | 'onFocus' | 'onBlur' | 'onKeyDown' | 'autoComplete'
  > & {
    ref: MutableRefObject<HTMLInputElement | null>;
  };
  selectedItem: Suggestion<D> | null;
  isFetching: boolean;
  isOpen: boolean;
  submit: () => void;
  reset: () => void;
}>;

export type ListContainerComponent<D = unknown> = React.ComponentType<{
  containerProps: {
    onMouseLeave: React.MouseEventHandler;
  };
  selectedItem: Suggestion<D> | null;
  isOpen: boolean;
  isFetching: boolean;
  submit: () => void;
}>;

export type Props<D = unknown> = {
  onQuery: OnQuerySignature<D>;
  onQueryBecomesObsolete?: OnQueryBecomesObsoleteSignature<D>;
  onSubmit: OnSubmitSignature<D>;
  formProps?: FormProps;
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
  debounceMs = 150,
  minCharsRequired = 3,
  inputComponent: InputComponent,
  listContainerComponent: ListContainerComponent,
  listComponent,
  minCharsComponent,
  noResultsComponent,
  errorComponent,
}: Props<D>): JSX.Element {
  debug.log('root it:', debug.updateIt('root'));

  const formRef = useRef<HTMLFormElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [showList, setShowList] = useState(false);

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
    gteMinChars: input.value.length >= minCharsRequired,
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

  const onEscapeDown = useCallback(
    function onEscapeDown() {
      perceivedInput.value = input.value;
      suggestionManager.selectId(null);

      // TODO:
      //  After a user pressed 'Escape' and then started typing again
      //  but before the query is resolved we should either show special
      //  loading message or don't show anything (since last results are
      //  obsolete, and we cannot say there is no results for the query,
      //  or for the user to start typing, since they already do). For now
      //  we choose the latter and use undefined value to preserve falsy
      //  checks, but it could be done better.

      suggestionManager.setSuggestions(undefined);
      setShowList(false);
    },
    [perceivedInput, input, suggestionManager]
  );

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
        [ESCAPE]: onEscapeDown,
        [ENTER]: submitWithKeyboard,
        [ARROW_UP]: selectPreviousSuggestion,
        [ARROW_DOWN]: selectNextSuggestion,
      };
    },
    [
      onEscapeDown,
      submitWithKeyboard,
      selectPreviousSuggestion,
      selectNextSuggestion,
    ]
  );

  const onKeyDown = useKeyDown(keyMap);

  const updateInput = useCallback(
    function updateInput(value: string) {
      if (value.trim().length < minCharsRequired) {
        queryManager.disposeQueries();
      }
      submitLocker.lastKeyboardId = null;
      submitLocker.lastMouseId = null;
      input.value = value;
      perceivedInput.value = value;
    },
    [minCharsRequired, queryManager, submitLocker, input, perceivedInput]
  );

  const onChange = useCallback(
    function onChange(e: React.ChangeEvent<HTMLInputElement>) {
      if (submitLocker.isLocked) {
        e.preventDefault();
        return;
      }
      updateInput(e.currentTarget.value);
      setShowList(true);
    },
    [submitLocker, updateInput]
  );

  const resetInput = useCallback(
    function resetInput() {
      if (submitLocker.isLocked) return;
      updateInput('');
    },
    [submitLocker, updateInput]
  );

  const onSubmit = useCallback(
    function onSubmit(e: React.FormEvent<HTMLFormElement>) {
      e.preventDefault();
      queryManager.disposeQueries();

      const id =
        submitLocker.getLockInitiator() === 'keyboard'
          ? submitLocker.lastKeyboardId
          : submitLocker.lastMouseId;

      submitLocker.release();
      submitLocker.lastKeyboardId = null;
      submitLocker.lastMouseId = null;

      consumerOnSubmit(
        {
          id,
          query: perceivedInput.value,
          suggestions: suggestionManager.state.suggestions,
          resetInput,
        },
        e
      );

      suggestionManager.setSuggestions(null);
      suggestionManager.selectId(null);

      suggestionList.setError(false);
      inputRef.current?.blur();
    },
    [
      consumerOnSubmit,
      perceivedInput,
      submitLocker,
      suggestionManager,
      suggestionList,
      queryManager,
      resetInput,
    ]
  );

  const onFocus = useCallback(function onFocus() {
    setShowList(true);
  }, []);

  const onBlur = useCallback(function onBlur() {
    setShowList(false);
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

  const isFetching = useIsFetching({
    gteMinChars: input.value.trim().length >= minCharsRequired,
    isRequestInFlight: queryManager.state.isFetching,
    inputValue: input.value.trim(),
    debouncedInputValue: debouncedInput.value.trim(),
  });

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
      debug.log('validateAndPerformQuery');

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

  const selectedId = suggestionManager.state.selectedId;
  const selectedItem = suggestionManager.getSuggestionById(selectedId);
  let listElement;

  if (!suggestionList.list.component) {
    listElement = null;
  } else if ('props' in suggestionList.list) {
    listElement = createElement(
      suggestionList.list.component,
      suggestionList.list.props
    );
  } else {
    listElement = createElement(suggestionList.list.component);
  }

  const isOpen = showList && Boolean(listElement);

  return (
    <form ref={formRef} onSubmit={onSubmit} {...formProps}>
      <InputComponent
        inputProps={inputProps}
        selectedItem={selectedItem}
        isFetching={isFetching}
        isOpen={isOpen}
        submit={submitWithKeyboard}
        reset={resetInput}
      />
      <ListContainerComponent
        containerProps={listContainerProps}
        selectedItem={selectedItem}
        isFetching={isFetching}
        isOpen={isOpen}
        submit={submitWithKeyboard}
      >
        {listElement}
      </ListContainerComponent>
    </form>
  );
}
