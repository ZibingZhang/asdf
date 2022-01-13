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
      "Ctrl-S": () => updateSettings()
    }
  }
);

function updateSettings() {
  try {
    const settings = JSON.parse(SETTINGS.getValue());
    if (!Array.isArray(settings) && typeof settings === "object") {
      window.racket.updateSettings(settings);
      return true;
    }
  } catch (e) { /* fall through */ }
  alert("The settings are not a valid JSON object.");
  return false;
}
