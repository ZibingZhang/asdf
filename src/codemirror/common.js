import {
  appendToRepl,
  resetRepl
} from "./repl.js";
import {
  handleTestResults,
  resetTestOutput
} from "./test-output.js";
import {
  EDITOR, markEditor
} from "./editor.js";

export {
  evaluate,
  runEditorCode,
  runReplCode
};

function runEditorCode() {
  resetRepl();
  evaluate(
    window.pipelines.evaluateProgram,
    EDITOR.getValue(),
    true,
    true
  );
}

function runReplCode(code) {
  evaluate(
    window.pipelines.evaluateRepl,
    code,
    false,
    false
  );
}

function evaluate(pipeline, text, clearTestOutput, highlight) {
  if (clearTestOutput) {
    resetTestOutput();
  }
  const stageOutput = pipeline.run(text);
  let output = "";
  if (stageOutput.errors.length > 0) {
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
