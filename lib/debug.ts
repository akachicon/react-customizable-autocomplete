const isDev = process?.env.NODE_ENV === 'development';

type DebuggerType = {
  updateIt: (key: string) => number;
  getIt: (key: string) => number;
  log: (...messages: Array<string | number>) => void;
};

class Debugger implements DebuggerType {
  private iterationMap: Record<string, number> = {};

  updateIt(key: string) {
    const itCount = this.iterationMap[key];
    const nextItCount = itCount === undefined ? 1 : itCount + 1;
    this.iterationMap[key] = nextItCount;

    return nextItCount;
  }

  getIt(key: string) {
    return this.iterationMap[key] ?? 0;
  }

  log(...messages: Array<string | number>) {
    console.log('[debug]:', ...messages);
  }
}

const fakeDebugger: DebuggerType = {
  updateIt() {
    return -1;
  },
  getIt() {
    return -1;
  },
  log() {
    return;
  },
};

const debug: DebuggerType = isDev ? new Debugger() : fakeDebugger;

export default debug;
