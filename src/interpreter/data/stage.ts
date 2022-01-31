import {
  SourceSpan
} from "./sourcespan";

export {
  Stage,
  StageError,
  StageOutput,
  StageTestResult
};

class StageError extends Error {
  constructor(
    readonly msg: string,
    readonly sourceSpan: SourceSpan
  ) {
    super(msg);
  }
}

class StageTestResult {
  constructor(
    readonly passed: boolean,
    readonly errMsg: string,
    readonly sourceSpan: SourceSpan
  ) {}
}

class StageOutput<T> {
  constructor(
    readonly output: T,
    readonly errors: StageError[] = [],
    readonly tests: StageTestResult[] = []
  ) {}
}

interface Stage<S, T> {
  run(input: StageOutput<S>): StageOutput<T>;
}
