import {
  Desugar
} from "./desugar.js";
import {
  EvaluateProgram
} from "./evaluate.js";
import {
  Lexer
} from "./lexing.js";
import {
  Pipeline
} from "./pipeline.js";
import {
  WellFormedProgram,
  WellFormedSyntax
} from "./well-formed.js";

declare global {
  interface Window {
    pipelines: {
      evaluateProgram: Pipeline
    }
  }
}

window.pipelines = {
  evaluateProgram: new Pipeline([
    new Lexer(),
    new WellFormedSyntax(),
    new WellFormedProgram(),
    new Desugar(),
    new EvaluateProgram()
  ])
};
