import type {
  Id,
  LockInitiator,
  ISubmissionLocker,
} from '../types/submission-locker';

// To preserve correctness of the form 'submit' event the following
// logic is implemented.
//
// - when a user uses keyboard to submit:
//    The correct input value corresponding to a submission item
//    is already in the field, so in this case pressing the 'Enter'
//    just sets a lock and calls the form's submit method. There could
//    be a situation where user changed selected item via pointer (mouse)
//    before pressing 'Enter'. To handle this case we track last selected
//    id by device.
//
// - when a user uses pointer to submit:
//    At the time the correct input value (corresponding to a submission
//    item) isn't yet set to the field, so the onCLick handler triggers
//    setting new perceived input, which is async, and sets a lock. This
//    change is being listened in onPointerSubmission effect, which checks
//    if the locker is locked and if a pointer was an initiator of the lock.
//    If so, the form's submit method is called.
//
// In onSubmit effect the locker is checked for the type of lock and
// then onSubmit continues the flow with the appropriate id and query text.

export default class SubmissionLocker implements ISubmissionLocker {
  isLocked = false;
  lastPointerSelectedId: Id = null;
  lastKeyboardSelectedId: Id = null;

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
