import {
  appendToRepl,
  resetRepl
} from "./repl.js";
import {
  handleTestResults,
  resetTestOutput
} from "./test-output.js";
import {
  EDITOR
} from "./editor.js";

export {
  evaluate,
  runEditorCode
};

function runEditorCode() {
  resetRepl();
  evaluate(
    window.pipelines.evaluateProgram,
    EDITOR.getValue(),
    true
  );
}

function evaluate(pipeline, text, clearTestOutput) {
  if (clearTestOutput) {
    resetTestOutput();
  }
  const stageOutput = pipeline.run(text);
  let output = "";
  if (stageOutput.errors.length > 0) {
    for (const error of stageOutput.errors) {
      output += `${error.sourceSpan.stringify()} ${error.msg}\n`;
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
