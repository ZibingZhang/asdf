import {
  switchToEditor
} from "./common.js";

export {
  SETTINGS,
  updateSettings
};

const initValue =
`{
  "stringify": {
    "abbreviatedList": false
  }
}`;

const settingsTextArea = document.getElementById("settings-textarea");
const SETTINGS = CodeMirror(
  (elt) => {
    settingsTextArea.parentNode.replaceChild(elt, settingsTextArea);
  }, {
    lineNumbers: true,
    tabSize: 2,
    value: initValue,
    mode: "application/json",
    extraKeys: {
      "Ctrl-S": () => switchToEditor()
    }
  }
);

function updateSettings() {
  const settings = JSON.parse(SETTINGS.getValue());
  window.racket.updateSettings(settings);
}
