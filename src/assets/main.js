import "./css/index.css";
import "./js/misc";

import {
  Controller
} from "./js/controller";

const controller = new Controller();

document.getElementById("run-button").onclick = controller.editor.runCode;
document.getElementById("editor-button").onclick = switchToEditor;
document.getElementById("settings-button").onclick = switchToSettings;
document.getElementById("info-button").onclick = switchToInfo;

// https://stackoverflow.com/a/11001012
document.addEventListener("keydown", function(e) {
  if (e.key === "s" && e.ctrlKey) {
    e.preventDefault();
  }
}, false);

window.racket.pipeline.setTestResultsCallback(controller.testOutput.handleTestResults);

const editorTab = document.getElementById("editor-tab");
const settingsTab = document.getElementById("settings-tab");
const infoTab = document.getElementById("info-tab");
let activeTab = "editor";

function switchToEditor() {
  if (activeTab === "settings") { if (!controller.settings.updateSettings()) { return; } }
  settingsTab.style.display = "none";
  infoTab.style.display = "none";
  editorTab.style.removeProperty("display");
  controller.editor.cm.refresh();
  controller.editor.cm.focus();
  activeTab = "editor";
}

function switchToSettings() {
  editorTab.style.display = "none";
  infoTab.style.display = "none";
  settingsTab.style.removeProperty("display");
  controller.settings.cm.refresh();
  controller.settings.cm.focus();
  activeTab = "settings";
}

function switchToInfo() {
  if (activeTab === "settings") { if (!controller.settings.updateSettings()) { return; } }
  editorTab.style.display = "none";
  settingsTab.style.display = "none";
  infoTab.style.removeProperty("display");
  controller.info.cm.refresh();
  activeTab = "info";
}
