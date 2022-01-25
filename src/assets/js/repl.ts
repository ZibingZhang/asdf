import {
  SourceSpan
} from "../../interpreter/sourcespan";

export {
  Repl
};

declare var CodeMirror: any;

class Repl {
  marked = false;
  cm: any;

  constructor(elementId: string) {
    const textArea = document.getElementById(elementId) || new Element();
    this.cm = CodeMirror(
      (elt: HTMLElement) => {
        textArea.parentNode?.replaceChild(elt, textArea);
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
    this.cm.on("change",
      (cm: any, changeObj: any) => {
        const match = changeObj.origin.match(/cm-highlight-error-message (\d+)/);
        if (match) {
          const lines = Number(match[1]);
          for (let i = 0; i < lines; i++) {
            this.cm.markText(
              { line: this.cm.lastLine() - 1 - i, ch: 0 },
              { line: this.cm.lastLine() - 1 - i },
              { className: "cm-highlight-error-message"}
            );
          }
        }

        if (this.marked && !changeObj.origin.match("ignore")) {
          cm.doc.getAllMarks()
            .filter((mark: any) => mark.className !== "cm-highlight-error-message")
            .forEach((mark: any) => mark.clear());
        }
      }
    );
    this.cm.on("cursorActivity",
      (cm: any) => cm.setCursor(cm.lineCount(), 0)
    );
    this.cm.on("keydown",
      (cm: any, event: any) => {
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
            this.appendToRepl("\n");
            const code = cm.doc.getLine(cm.doc.lastLine() - 1).slice(2);
            this.runCode(code);
            break;
          }
        }
      }
    );
  }

  mark(sourceSpan: SourceSpan) {
    this.marked = true;
    const line = this.cm.lastLine() - 1;
    this.cm.markText(
      { line, ch: sourceSpan.startColno + 2 },
      { line, ch: sourceSpan.endColno + 2 },
      { className: "cm-highlight-error" }
    );
  }

  runCode(code: string) {
    window.racket.pipeline.setErrorsCallback(stageErrors => {
      let replOutput = "";
      for (const stageError of stageErrors) {
        this.mark(stageError.sourceSpan);
        replOutput += stageError.msg + "\n";
      }
      replOutput += "> ";
      this.appendToRepl(replOutput, "cm-highlight-error-message");
    });
    window.racket.pipeline.setUnusedCallback(null);
    window.racket.pipeline.evaluateCode(code);
  }

  appendToRepl(text: string, className = "") {
    this.cm.replaceRange(text, CodeMirror.Pos(this.cm.lastLine()), null, `ignore ${className} ${(text.match(/\n/g) || "").length}`);
  }

  resetRepl() {
    this.cm.setValue("");
  }
}
