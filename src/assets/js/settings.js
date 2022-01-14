export {
  SETTINGS,
  updateSettings
};

const initValue =
`{
  "primitives": {
    "blackList": []
  },
  "stringify": {
    "abbreviatedList": false
  },
  "syntax": {
    "forms": [
      "and",
      "check-error",
      "check-expect",
      "check-member-of",
      "check-random",
      "check-range",
      "check-satisfied",
      "check-within",
      "cond",
      "define",
      "define-struct",
      "else",
      "if",
      "lambda",
      "or",
      "quote"
    ]
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
