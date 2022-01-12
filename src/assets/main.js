import "./css/index.css";
import "./js/misc";

import {
  SETTINGS,
  updateSettings
} from "./js/settings";
import {
  EDITOR
} from "./js/editor";
import {
  INFO
} from "./js/info";
import {
  runEditorCode
} from "./js/common";

function init() {
  document.getElementById("run-button").onclick = () => runEditorCode(EDITOR.getValue());
  document.getElementById("editor-button").onclick = switchToEditor;
  document.getElementById("settings-button").onclick = switchToSettings;
  document.getElementById("info-button").onclick = switchToInfo;

  // https://stackoverflow.com/a/11001012
  document.addEventListener("keydown", function(e) {
    if (e.key === "s" && e.ctrlKey) {
      e.preventDefault();
    }
  }, false);

  EDITOR.focus();
  updateSettings();
}

const editorTab = document.getElementById("editor-tab");
const settingsTab = document.getElementById("settings-tab");
const infoTab = document.getElementById("info-tab");
let activeTab = "editor";

function switchToEditor() {
  if (activeTab === "settings") { updateSettings(); }
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
  if (activeTab === "settings") { updateSettings(); }
  editorTab.style.display = "none";
  settingsTab.style.display = "none";
  infoTab.style.removeProperty("display");
  INFO.refresh();
  activeTab = "info";
}

init();
