import {
  EVALUATE_CODE_STAGE,
  LEXING_STAGE,
  PARSING_SEXPRS_STAGE,
  Pipeline,
  WELL_FORMED_PROGRAM_STAGE
} from "./pipeline";
import {
  Settings,
  updateSettings
} from "./settings";

declare global {
  interface Window {
    racket: {
      updateSettings: (settings: JSON) => void,
      pipelines: {
        evaluateProgram: Pipeline,
        evaluateRepl: Pipeline
      }
    }
  }
}

window.racket = {
  updateSettings: settings => updateSettings(<Settings>settings),
  pipelines: {
    evaluateProgram: new Pipeline(
      [
        LEXING_STAGE,
        PARSING_SEXPRS_STAGE,
        WELL_FORMED_PROGRAM_STAGE,
        EVALUATE_CODE_STAGE
      ],
      true
    ),
    evaluateRepl: new Pipeline(
      [
        LEXING_STAGE,
        PARSING_SEXPRS_STAGE,
        WELL_FORMED_PROGRAM_STAGE,
        EVALUATE_CODE_STAGE
      ],
      false
    )
  }
};
