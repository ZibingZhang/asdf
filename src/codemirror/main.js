import "./mode/racket/racket.js";
import {
  runEditorCode,
  switchToEditor,
  switchToInfo,
  switchToSettings
} from "./common";
import {
  updateSettings
} from "./settings";

document.getElementById("run-button").onclick = runEditorCode;
document.getElementById("editor-button").onclick = switchToEditor;
document.getElementById("settings-button").onclick = switchToSettings;
document.getElementById("info-button").onclick = switchToInfo;

updateSettings();

// https://stackoverflow.com/a/11001012
document.addEventListener("keydown", function(e) {
  if (e.key === "s" && e.ctrlKey) {
    e.preventDefault();
  }
}, false);
