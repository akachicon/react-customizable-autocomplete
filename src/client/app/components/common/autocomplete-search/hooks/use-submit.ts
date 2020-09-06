import React, { useCallback } from 'react';
import type { MutableRefObject } from 'react';
import type { ISubmissionLocker } from '../types/submission-locker';
import {
  OnQueryReturnPromise,
  OnSubmitHandler,
  SuggestionResult,
} from '../types/autocomplete-search-props';

type Ref<T> = MutableRefObject<T>;

type Suggestions<SuggestionData = unknown> =
  | readonly SuggestionResult<SuggestionData>[]
  | null;

type SuggestionsSetter<SuggestionData = unknown> = (
  suggestions: Suggestions<SuggestionData>
) => void;

type Dependencies<SuggestionData = unknown> = {
  submissionLockerRf: Ref<ISubmissionLocker>;
  perceivedInputValRf: Ref<string>;
  suggestionsRf: Ref<Suggestions<SuggestionData>>;
  inputRf: Ref<HTMLInputElement | null>;
  queryTimestampsRf: Ref<Map<OnQueryReturnPromise<SuggestionData>, number>>;
  latestResolvedQueryTimestampRf: Ref<number>;
  setSuggestionsSt: SuggestionsSetter<SuggestionData>;
  setSelectedSuggestionIdSt: (
    suggestion: SuggestionResult<SuggestionData>['id'] | null
  ) => void;
  setInputValSt: (val: string) => void;
  setShowQueryErrorSt: (flag: boolean) => void;
  onSubmit: OnSubmitHandler<SuggestionData>;
  preserveInputOnSubmit: boolean;
  disposeCurrentQuery: (...args: unknown[]) => void;
  setPerceivedInputVal: (val: string) => void;
};

export default function useOnSubmit<SuggestionData = unknown>({
  submissionLockerRf,
  perceivedInputValRf,
  suggestionsRf,
  inputRf,
  queryTimestampsRf,
  latestResolvedQueryTimestampRf,
  setSuggestionsSt,
  setSelectedSuggestionIdSt,
  setInputValSt,
  setShowQueryErrorSt,
  onSubmit,
  preserveInputOnSubmit,
  disposeCurrentQuery,
  setPerceivedInputVal,
}: Dependencies<SuggestionData>): React.FormEventHandler {
  return useCallback(
    function onFormSubmit(e: React.FormEvent<HTMLFormElement>) {
      e.preventDefault();
      disposeCurrentQuery();

      const locker = submissionLockerRf.current;
      const id =
        locker.getLockInitiator() === 'keyboard'
          ? locker.lastKeyboardSelectedId
          : locker.lastPointerSelectedId;

      onSubmit(
        {
          id,
          query: perceivedInputValRf.current,
          suggestions: suggestionsRf.current,
        },
        e
      );

      locker.release();
      locker.lastKeyboardSelectedId = null;
      locker.lastPointerSelectedId = null;

      setSuggestionsSt(null);
      setSelectedSuggestionIdSt(null);
      setInputValSt('');
      setShowQueryErrorSt(false);
      queryTimestampsRf.current = new Map<OnQueryReturnPromise, number>();
      latestResolvedQueryTimestampRf.current = 0;

      if (!preserveInputOnSubmit) {
        setPerceivedInputVal('');
      }
      inputRf.current?.blur();
    },
    [onSubmit, preserveInputOnSubmit, disposeCurrentQuery, setPerceivedInputVal]
  );
}
