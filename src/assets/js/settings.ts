/* eslint-disable @typescript-eslint/no-explicit-any */
export {
  Settings
};

declare let CodeMirror: CodeMirror;

class Settings {
  private INIT_VALUE = `{
  "higherOrderFunctions": true,
  "primitives": {
    "blackList": [],
    "relaxedConditions": [
      "*",
      "+",
      "/",
      "string-append",
      "string-ci<=?",
      "string-ci<?",
      "string-ci=?",
      "string-ci>=?",
      "string-ci>?",
      "string<=?",
      "string<?",
      "string=?",
      "string>=?",
      "string>?"
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
      "local",
      "or",
      "quasiquote",
      "quote",
      "require",
      "unquote"
    ],
    "lambdaExpression": true,
    "listAbbreviation": true,
    "quasiquoting": true
  }
}`;

  cm: CodeMirror;

  constructor(elementId: string) {
    const textArea = <HTMLElement>document.getElementById(elementId);
    this.cm = CodeMirror(
      (elt: HTMLElement) => {
        textArea.parentNode?.replaceChild(elt, textArea);
      }, {
        lineNumbers: true,
        tabSize: 2,
        value: this.INIT_VALUE,
        mode: "application/json",
        extraKeys: {
          "Ctrl-S": () => this.updateSettings()
        }
      }
    );
  }

  updateSettings(): boolean {
    try {
      const settings = JSON.parse(this.cm.getValue());
      if (!Array.isArray(settings) && typeof settings === "object") {
        window.racket.updateSettings(settings);
        return true;
      }
    } catch (e) { /* fall through */ }
    alert("The settings are not a valid JSON object.");
    return false;
  }
}
