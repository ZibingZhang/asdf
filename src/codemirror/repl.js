import {
  evaluate
} from "./common.js";

export {
  appendToRepl,
  resetRepl
};

const replTextArea = document.getElementById("repl-textarea");
const REPL = CodeMirror(
  (elt) => {
    replTextArea.parentNode.replaceChild(elt, replTextArea);
  }, {
    tabSize: 2,
    value: "> ",
    mode: null,
    lineWrapping: true,
    smartIndent: false
  }
);
const replDoc = REPL.getDoc();

const resetRepl =
  () => REPL.setValue("");
const appendToRepl =
  text => REPL.replaceRange(text, CodeMirror.Pos(REPL.lastLine()));
const appendToReplLn =
  text => appendToRepl(`${text}\n`);

REPL.on("cursorActivity",
  REPL => REPL.setCursor(REPL.lineCount(), 0)
);
REPL.on("keydown",
  (_, event) => {
    switch (event.key) {
      case "Backspace": {
        const lastLine = replDoc.getLine(replDoc.lastLine());
        if (lastLine === "> ") {
          event.preventDefault();
        }
        break;
      }
      case "Enter": {
        event.preventDefault();
        appendToReplLn("");
        const text = replDoc.getLine(replDoc.lastLine() - 1).slice(2);
        evaluate(
          window.pipelines.evaluateRepl,
          text,
          false
        );
        break;
      }
    }
  }
);
