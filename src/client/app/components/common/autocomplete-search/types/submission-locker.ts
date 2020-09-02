export type Id = string | null;

export type LockInitiator = 'keyboard' | 'pointer' | null;

export interface ISubmissionLocker {
  readonly isLocked: boolean;
  lastPointerSelectedId: Id;
  lastKeyboardSelectedId: Id;
  lock(initiator: NonNullable<LockInitiator>): boolean;
  release(): void;
  getLockInitiator(): LockInitiator;
}
