import { EvaluateProgram } from "./evaluate.js";
import { Lexer } from "./lexing.js";
import { Pipeline } from "./pipeline.js";
import { WellFormedProgram, WellFormedSyntax } from "./wellformed.js";

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
    new EvaluateProgram()
  ])
};
