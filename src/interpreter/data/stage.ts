import {
  SourceSpan
} from "./sourcespan";

export {
  Stage,
  StageResult,
  StageError,
  StageTestResult,
  makeStageResult,
  makeStageTestResult
};

type Stage<S, T> = {
  run(result: StageResult<S>): StageResult<T>;
}

type StageResult<T> = {
  readonly output: T;
  readonly errors: StageError[];
  readonly tests: StageTestResult[];
}

class StageError extends Error {
  constructor(
    readonly msg: string,
    readonly sourceSpan: SourceSpan
  ) {
    super(msg);
  }
}

type StageTestResult = {
  readonly passed: boolean;
  readonly errMsg: string;
  readonly sourceSpan: SourceSpan;
}

function makeStageResult<T>(
  output: T,
  errors: StageError[] = [],
  tests: StageTestResult[] = []
): StageResult<T> {
  return {
    output,
    errors,
    tests
  };
}

function makeStageTestResult(
  passed: boolean,
  errMsg: string,
  sourceSpan: SourceSpan
): StageTestResult {
  return {
    passed,
    errMsg,
    sourceSpan
  };
}
