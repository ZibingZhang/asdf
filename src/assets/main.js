import "./css/index.css";
import "./js/misc";

import {
  Editor
} from "./js/editor";
import {
  Settings
} from "./js/settings";
import {
  Info
} from "./js/info";
import {
  Repl
} from "./js/repl";
import {
  handleTestResults
} from "./js/test-output";

const EDITOR = new Editor("editor-textarea");
const SETTINGS = new Settings("settings-textarea");
const INFO = new Info("info-textarea");
const REPL = new Repl("repl-textarea");

EDITOR.registerRepl(REPL);

function init() {
  document.getElementById("run-button").onclick = EDITOR.runEditorCode;
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
    REPL.appendToRepl(replOutput);
  });
  window.racket.pipeline.setTestResultsCallback(handleTestResults);

  EDITOR.cm.focus();
  SETTINGS.updateSettings();
}

const editorTab = document.getElementById("editor-tab");
const settingsTab = document.getElementById("settings-tab");
const infoTab = document.getElementById("info-tab");
let activeTab = "editor";

function switchToEditor() {
  if (activeTab === "settings") { if (!SETTINGS.updateSettings()) { return; } }
  settingsTab.style.display = "none";
  infoTab.style.display = "none";
  editorTab.style.removeProperty("display");
  EDITOR.cm.refresh();
  EDITOR.cm.focus();
  activeTab = "editor";
}

function switchToSettings() {
  editorTab.style.display = "none";
  infoTab.style.display = "none";
  settingsTab.style.removeProperty("display");
  SETTINGS.cm.refresh();
  SETTINGS.cm.focus();
  activeTab = "settings";
}

function switchToInfo() {
  if (activeTab === "settings") { if (!SETTINGS.updateSettings()) { return; } }
  editorTab.style.display = "none";
  settingsTab.style.display = "none";
  infoTab.style.removeProperty("display");
  INFO.cm.refresh();
  activeTab = "info";
}

init();
