import {
  EVALUATE_CODE_STAGE,
  LEXING_STAGE,
  Pipeline,
  WELL_FORMED_PROGRAM_STAGE,
  WELL_FORMED_SYNTAX_STAGE
} from "./pipeline.js";

declare global {
  interface Window {
    pipelines: {
      evaluateProgram: Pipeline,
      evaluateRepl: Pipeline
    }
  }
}

window.pipelines = {
  evaluateProgram: new Pipeline(
    [
      LEXING_STAGE,
      WELL_FORMED_SYNTAX_STAGE,
      WELL_FORMED_PROGRAM_STAGE,
      EVALUATE_CODE_STAGE
    ],
    true
  ),
  evaluateRepl: new Pipeline(
    [
      LEXING_STAGE,
      WELL_FORMED_SYNTAX_STAGE,
      WELL_FORMED_PROGRAM_STAGE,
      EVALUATE_CODE_STAGE
    ],
    false
  )
};
