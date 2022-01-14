export {
  appendToRepl,
  markREPL,
  resetRepl,
  runReplCode
};

const replTextArea = document.getElementById("repl-textarea");
const REPL = CodeMirror(
  (elt) => {
    replTextArea.parentNode.replaceChild(elt, replTextArea);
  }, {
    lineWrapping: true,
    smartIndent: false,
    tabSize: 2,
    value: "> ",
    mode: "racket",
    theme: "racket"
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
REPL.on("change",
  (cm, changeObj) => {
    const match = changeObj.origin.match(/cm-highlight-error-message (\d+)/);
    if (match) {
      const lines = Number(match[1]);
      for (let i = 0; i < lines; i++) {
        REPL.markText(
          { line: REPL.lastLine() - 1 - i, ch: 0 },
          { line: REPL.lastLine() - 1 - i },
          { className: "cm-highlight-error-message"}
        );
      }
    }

    if (replMarked && !changeObj.origin.match("ignore")) {
      cm.doc.getAllMarks()
        .filter(marker => marker.className !== "cm-highlight-error-message")
        .forEach(marker => marker.clear());
    }
  }
);
REPL.on("cursorActivity",
  (cm) => cm.setCursor(cm.lineCount(), 0)
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
        appendToRepl("\n");
        const code = cm.doc.getLine(cm.doc.lastLine() - 1).slice(2);
        runReplCode(code);
        break;
      }
    }
  }
);

function appendToRepl(text, className) {
  REPL.replaceRange(text, CodeMirror.Pos(REPL.lastLine()), null, `ignore ${className} ${(text.match(/\n/g) || "").length}`);
}

function resetRepl() {
  REPL.setValue("");
}

function runReplCode(code) {
  window.racket.pipeline.setErrorsCallback(stageErrors => {
    let replOutput = "";
    for (const stageError of stageErrors) {
      markREPL(stageError.sourceSpan);
      replOutput += stageError.msg + "\n";
    }
    replOutput += "> ";
    appendToRepl(replOutput, "cm-highlight-error-message");
  });
  window.racket.pipeline.setUnusedCallback(null);
  window.racket.pipeline.evaluateCode(code);
}

let replMarked = false;
function markREPL(sourceSpan) {
  replMarked = true;
  const line = REPL.lastLine() - 1;
  REPL.markText(
    { line, ch: sourceSpan.startColno + 2 },
    { line, ch: sourceSpan.endColno + 2 },
    { className: "cm-highlight-error" }
  );
}
