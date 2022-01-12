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
import {
  INFO
} from "./info.js";

export {
  runEditorCode,
  runReplCode,
  switchToEditor,
  switchToSettings,
  switchToInfo
};

function runEditorCode() {
  resetRepl();
  resetTestOutput();
  evaluate(
    window.racket.pipelines.evaluateProgram,
    EDITOR.getValue(),
    true
  );
}

function runReplCode(code) {
  evaluate(
    window.racket.pipelines.evaluateRepl,
    code,
    false
  );
}

function evaluate(pipeline, text, highlight) {
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
const infoTab = document.getElementById("info-tab");
let activeTab = "editor";

function switchToEditor() {
  try {
    if (activeTab === "settings") { updateSettings(); }
    settingsTab.style.display = "none";
    infoTab.style.display = "none";
    editorTab.style.removeProperty("display");
    EDITOR.refresh();
    EDITOR.focus();
    activeTab = "editor";
  } catch (e) {
    alert("The settings are not a valid JSON object.");
  }
}

function switchToSettings() {
  editorTab.style.display = "none";
  infoTab.style.display = "none";
  settingsTab.style.removeProperty("display");
  SETTINGS.refresh();
  SETTINGS.focus();
  activeTab = "settings";
}

function switchToInfo() {
  if (activeTab === "settings") { updateSettings(); }
  editorTab.style.display = "none";
  settingsTab.style.display = "none";
  infoTab.style.removeProperty("display");
  INFO.refresh();
  activeTab = "info";
}
