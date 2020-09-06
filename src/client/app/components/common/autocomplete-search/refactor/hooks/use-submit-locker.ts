import { useState } from 'react';
import type { SuggestionId } from './use-suggestion-manager';

// To preserve correctness of the form 'submit' event the following
// logic is implemented.
//
// - when a user uses keyboard to submit:
//    The correct input value corresponding to a submission item
//    is already in the field, so in this case pressing the 'Enter'
//    just sets a lock and calls the form's submit method. There could
//    be a situation where user changed selected item via mouse
//    before pressing 'Enter'. To pass the correct id to the submit handler
//    we track last selected id by device.
//
// - when a user uses mouse to submit:
//    At the time the correct input value (corresponding to a submission
//    item) isn't yet set to the field, so the onMouseDown handler triggers
//    setting new perceived input, which is async, and sets a lock. This
//    change is being listened in onMouseSubmit effect, which checks
//    if the locker is locked and if a mouse was an initiator of the lock.
//    If so, the form's submit method is called.
//
// In onSubmit effect the locker is checked for the type of lock and
// then onSubmit continues the flow with the appropriate id and query text.

export type LockInitiator = 'keyboard' | 'mouse' | null;

export interface ISubmitLocker {
  readonly isLocked: boolean;
  lastMouseId: SuggestionId;
  lastKeyboardId: SuggestionId;
  lock(initiator: NonNullable<LockInitiator>): boolean;
  release(): void;
  getLockInitiator(): LockInitiator;
}

export default function useSubmitLocker(): ISubmitLocker {
  class SubmitLocker implements ISubmitLocker {
    isLocked = false;
    lastMouseId: SuggestionId = null;
    lastKeyboardId: SuggestionId = null;

    private lockInitiator: LockInitiator = null;

    lock(initiator: LockInitiator): boolean {
      if (!initiator || this.isLocked) return false;

      this.lockInitiator = initiator;
      this.isLocked = true;
      return true;
    }

    release(): void {
      this.lockInitiator = null;
      this.isLocked = false;
    }

    getLockInitiator(): LockInitiator {
      return this.lockInitiator;
    }
  }

  return useState(() => new SubmitLocker())[0];
}
