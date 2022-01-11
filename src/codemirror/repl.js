import {
  runReplCode
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
    // extraKeys: {
    //   "Alt-I": () => {
    //     let element = document.createElement("canvas");
    //     const ctx = element.getContext('2d');
    //     ctx.fillStyle = 'green';
    //     ctx.fillRect(10, 10, 150, 100);

    //     REPL_DOC.addLineWidget(
    //       REPL_DOC.lastLine(),
    //       element
    //     )
    //   }
    // }
  }
);

function resetRepl() {
  REPL.setValue("");
}
function appendToRepl(text) {
  REPL.replaceRange(text, CodeMirror.Pos(REPL.lastLine()));
}
function appendToReplLn(text) {
  appendToRepl(`${text}\n`);
}

REPL.on("cursorActivity",
  cm => cm.setCursor(cm.lineCount(), 0)
);
REPL.on("keydown",
  (cm, event) => {
    switch (event.key) {
      case "Backspace": {
        const lastLine = cm.doc.getLine(cm.doc.lastLine());
        if (lastLine === "> ") {
          event.preventDefault();
        }
        break;
      }
      case "Enter": {
        event.preventDefault();
        appendToReplLn("");
        const text = cm.doc.getLine(cm.doc.lastLine() - 1).slice(2);
        runReplCode(text);
        break;
      }
    }
  }
);
