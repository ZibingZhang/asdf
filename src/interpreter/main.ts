import { Lexer } from "./lexing.js";
import { Pipeline } from "./pipeline.js";

declare global {
  interface Window {
    pipelines: {
      evaluateProgram: Pipeline
    }
  }
}

window.pipelines = {
  evaluateProgram: new Pipeline([new Lexer()])
};
