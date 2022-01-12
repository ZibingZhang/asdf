import {
  EDITOR,
  markEditor
} from "./editor";
import {
  appendToRepl,
  resetRepl
} from "./repl";
import {
  handleTestResults,
  resetTestOutput
} from "./test-output";

export {
  runEditorCode,
  runReplCode
};

function runEditorCode() {
  resetRepl();
  resetTestOutput();
  evaluateCode(EDITOR.getValue(), true);
}

function runReplCode(code) {
  evaluateCode(code, false);
}

function evaluateCode(code, highlight) {
  window.racket.pipeline.reset();
  const stageOutput = window.racket.pipeline.evaluateCode(code);
  let output = "";
  if (stageOutput.errors.length > 0) {
    window.racket.pipeline.reset();
    for (const error of stageOutput.errors) {
      if (highlight) {
        markEditor(error.sourceSpan);
      }
      output += error.msg + "\n";
    }
  } else {
    for (const text of stageOutput.output) {
      output += text + "\n";
    }
  }
  output += "> ";
  appendToRepl(output);
  handleTestResults(stageOutput.tests);
}
