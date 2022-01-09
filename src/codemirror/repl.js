import {
  evaluate
} from "./common.js";

export {
  resetRepl,
  appendToRepl
};

const replTextArea = document.getElementById("repl");
const repl = CodeMirror(
  (elt) => {
    replTextArea.parentNode.replaceChild(elt, replTextArea);
  }, {
    tabSize: 2,
    value: "> ",
    mode: null,
    theme: "monokai",
    lineWrapping: true,
    smartIndent: false
  }
);
const replDoc = repl.getDoc();

const resetRepl =
  () => repl.setValue("");
const appendToRepl =
  text => repl.replaceRange(text, CodeMirror.Pos(repl.lastLine()));
const appendToReplLn =
  text => appendToRepl(`${text}\n`);

repl.on("cursorActivity",
  repl => repl.setCursor(repl.lineCount(), 0)
);
repl.on("keydown",
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
