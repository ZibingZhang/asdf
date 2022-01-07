/* eslint-disable @typescript-eslint/no-explicit-any */

import { Desugar } from "./desugar.js";
import { EvaluateCode } from "./evaluate.js";
import { Lexer } from "./lexing.js";
import {
  SourceSpan
} from "./sourcespan.js";
import { WellFormedProgram, WellFormedSyntax } from "./well-formed.js";

export {
  DESUGAR_STAGE,
  EVALUATE_CODE_STAGE,
  LEXING_STAGE,
  WELL_FORMED_SYNTAX_STAGE,
  WELL_FORMED_PROGRAM_STAGE,
  Pipeline,
  Stage,
  StageError,
  StageOutput
};

class StageError extends Error {
  constructor(
    readonly msg: string,
    readonly sourcespan: SourceSpan
  ) {
    super(msg);
  }
}

class StageOutput<T> {
  constructor(
    readonly output: T,
    readonly errors: StageError[] = []
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
        resetStages();
        return nextInput;
      }
    }
    return nextInput;
  }
}

const LEXING_STAGE = new Lexer();
const WELL_FORMED_SYNTAX_STAGE = new WellFormedSyntax();
const DESUGAR_STAGE = new Desugar();
const WELL_FORMED_PROGRAM_STAGE = new WellFormedProgram();
const EVALUATE_CODE_STAGE = new EvaluateCode();

function resetStages() {
  WELL_FORMED_PROGRAM_STAGE.reset();
  EVALUATE_CODE_STAGE.reset();
}
