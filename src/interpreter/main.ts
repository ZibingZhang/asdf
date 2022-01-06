import {
  DESUGAR_STAGE
} from "./desugar.js";
import {
  EVALUATE_CODE_STAGE
} from "./evaluate.js";
import {
  LEXING_STAGE
} from "./lexing.js";
import {
  Pipeline
} from "./pipeline.js";
import { RESET_STAGE } from "./reset.js";
import {
  WELL_FORMED_PROGRAM_STAGE,
  WELL_FORMED_SYNTAX_STAGE
} from "./well-formed.js";

declare global {
  interface Window {
    pipelines: {
      evaluateProgram: Pipeline,
      evaluateRepl: Pipeline
    }
  }
}

window.pipelines = {
  evaluateProgram: new Pipeline([
    RESET_STAGE,
    LEXING_STAGE,
    WELL_FORMED_SYNTAX_STAGE,
    WELL_FORMED_PROGRAM_STAGE,
    DESUGAR_STAGE,
    EVALUATE_CODE_STAGE
  ]),
  evaluateRepl: new Pipeline([
    LEXING_STAGE,
    WELL_FORMED_SYNTAX_STAGE,
    WELL_FORMED_PROGRAM_STAGE,
    DESUGAR_STAGE,
    EVALUATE_CODE_STAGE
  ])
};
