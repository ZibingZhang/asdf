/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  EvaluateCode
} from "./evaluate";
import {
  Lexer
} from "./lexing";
import {
  ParseSExpr
} from "./parse";
import {
  RNG
} from "./random";
import {
  SourceSpan
} from "./sourcespan";
import {
  WellFormedProgram
} from "./well-formed";

export {
  Pipeline,
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

const LEXING_STAGE = new Lexer();
const PARSING_SEXPRS_STAGE = new ParseSExpr();
const WELL_FORMED_PROGRAM_STAGE = new WellFormedProgram();
const EVALUATE_CODE_STAGE = new EvaluateCode();

class Pipeline {
  stages: Stage<any, any>[] = [
    LEXING_STAGE,
    PARSING_SEXPRS_STAGE,
    WELL_FORMED_PROGRAM_STAGE,
    EVALUATE_CODE_STAGE
  ];

  evaluateCode(code: string): StageOutput<any> {
    let nextInput = new StageOutput(code);
    for (const stage of this.stages) {
      nextInput = stage.run(nextInput);
      if (nextInput.errors.length > 0) {
        return nextInput;
      }
    }
    return nextInput;
  }

  reset() {
    RNG.reset();
    WELL_FORMED_PROGRAM_STAGE.reset();
    EVALUATE_CODE_STAGE.reset();
  }
}
