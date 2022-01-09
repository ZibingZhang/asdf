/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  EvaluateCode
} from "./evaluate.js";
import {
  Lexer
} from "./lexing.js";
import {
  ParseSExpr
} from "./parse.js";
import {
  RNG
} from "./random.js";
import {
  SourceSpan
} from "./sourcespan.js";
import {
  WellFormedProgram
} from "./well-formed.js";

export {
  EVALUATE_CODE_STAGE,
  LEXING_STAGE,
  PARSING_SEXPRS_STAGE,
  WELL_FORMED_PROGRAM_STAGE,
  Pipeline,
  Stage,
  StageError,
  StageOutput,
  StageTestResult
};

class StageError extends Error {
  constructor(
    readonly msg: string,
    readonly sourcespan: SourceSpan
  ) {
    super(msg);
  }
}

class StageTestResult {
  constructor(
    readonly passed: boolean,
    readonly errMsg: string | null = null
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

class Pipeline {
  constructor(
    readonly stages: Stage<any, any>[],
    readonly reset: boolean
  ) {}

  run(program: string): StageOutput<any> {
    if (this.reset) { resetStages(); }
    let nextInput = new StageOutput(program);
    for (const stage of this.stages) {
      nextInput = stage.run(nextInput);
      if (nextInput.errors.length > 0) {
        if (this.reset) { resetStages(); }
        return nextInput;
      }
    }
    return nextInput;
  }
}

const LEXING_STAGE = new Lexer();
const PARSING_SEXPRS_STAGE = new ParseSExpr();
const WELL_FORMED_PROGRAM_STAGE = new WellFormedProgram();
const EVALUATE_CODE_STAGE = new EvaluateCode();

function resetStages() {
  RNG.reset();
  WELL_FORMED_PROGRAM_STAGE.reset();
  EVALUATE_CODE_STAGE.reset();
}
