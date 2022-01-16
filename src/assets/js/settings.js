export {
  SETTINGS,
  updateSettings
};

const initValue =
`{
  "higherOrderFunctions": true,
  "primitives": {
    "blackList": [],
    "relaxedConditions": [
      "*",
      "+",
      "/"
    ]
  },
  "stringify": {
    "abbreviatedList": true
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
      "letrec",
      "let*",
      "let",
      "or",
      "quote",
      "require"
    ],
    "listAbbreviation": true
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
