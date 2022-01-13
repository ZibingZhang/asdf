import "./css/index.css";
import "./js/misc";

import {
  SETTINGS,
  updateSettings
} from "./js/settings";
import {
  EDITOR,
  runEditorCode
} from "./js/editor";
import {
  INFO
} from "./js/info";
import {
  appendToRepl
} from "./js/repl";
import {
  handleTestResults
} from "./js/test-output";

function init() {
  document.getElementById("run-button").onclick = runEditorCode;
  document.getElementById("editor-button").onclick = switchToEditor;
  document.getElementById("settings-button").onclick = switchToSettings;
  document.getElementById("info-button").onclick = switchToInfo;

  // https://stackoverflow.com/a/11001012
  document.addEventListener("keydown", function(e) {
    if (e.key === "s" && e.ctrlKey) {
      e.preventDefault();
    }
  }, false);

  window.racket.pipeline.setSuccessCallback(output => {
    let replOutput = "";
    for (const text of output) {
      replOutput += text + "\n";
    }
    replOutput += "> ";
    appendToRepl(replOutput);
  });
  window.racket.pipeline.setTestResultsCallback(handleTestResults);

  EDITOR.focus();
  updateSettings();
}

const editorTab = document.getElementById("editor-tab");
const settingsTab = document.getElementById("settings-tab");
const infoTab = document.getElementById("info-tab");
let activeTab = "editor";

function switchToEditor() {
  if (activeTab === "settings") { if (!updateSettings()) { return; } }
  settingsTab.style.display = "none";
  infoTab.style.display = "none";
  editorTab.style.removeProperty("display");
  EDITOR.refresh();
  EDITOR.focus();
  activeTab = "editor";
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
  if (activeTab === "settings") { if (!updateSettings()) { return; } }
  editorTab.style.display = "none";
  settingsTab.style.display = "none";
  infoTab.style.removeProperty("display");
  INFO.refresh();
  activeTab = "info";
}

init();
