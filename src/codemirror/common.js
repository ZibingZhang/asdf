import {
  EDITOR,
  markEditor
} from "./editor.js";
import {
  appendToRepl,
  resetRepl
} from "./repl.js";
import {
  handleTestResults,
  resetTestOutput
} from "./test-output.js";
import {
  SETTINGS,
  updateSettings
} from "./settings.js";

export {
  runEditorCode,
  runReplCode,
  switchToEditor,
  switchToSettings
};

function runEditorCode() {
  resetRepl();
  evaluate(
    window.racket.pipelines.evaluateProgram,
    EDITOR.getValue(),
    true,
    true
  );
}

function runReplCode(code) {
  evaluate(
    window.racket.pipelines.evaluateRepl,
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

const editorTab = document.getElementById("editor-tab");
const settingsTab = document.getElementById("settings-tab");

function switchToEditor() {
  try {
    updateSettings();
    settingsTab.style.display = "none";
    editorTab.style.removeProperty("display");
    EDITOR.refresh();
  } catch (e) {
    alert("The settings are not a valid JSON object.");
  }
}

function switchToSettings() {
  editorTab.style.display = "none";
  settingsTab.style.removeProperty("display");
  SETTINGS.refresh();
}
