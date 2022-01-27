/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  SourceSpan
} from "../../interpreter/sourcespan";

export {
  Repl
};

declare let CodeMirror: any;

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
        theme: "racket",
        styleSelectedText: true,
        extraKeys: {
          "Alt-I": () => {
            let element = document.createElement("canvas");
            element.width = 150;
            element.height = 100;
            const ctx = element.getContext('2d')!;
            ctx.fillStyle = 'green';
            ctx.fillRect(0, 0, 150, 100);
            this.cm.addLineWidget(
              this.cm.lastLine(),
              element
            );
            this.cm.scrollIntoView(this.cm.lastLine());
            this.appendToRepl("\n> ");
          }
        }
      }
    );
    // https://stackoverflow.com/a/11999862
    this.cm.getSelectedRange = () => {
      return { from: this.cm.getCursor(true), to: this.cm.getCursor(false) };
    };
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
    this.cm.on("keydown",
      (cm: any, event: any) => {
        switch (event.key) {
          case "Backspace": {
            if (!cm.somethingSelected()) {
              const cursor = cm.getCursor();
              const lineCount = cm.lineCount();
              if (
                cursor.line !== lineCount - 1
                || cursor.ch <= 2
              ) {
                event.preventDefault();
              }
            } else {
              const selection = cm.getSelection();
              const selectedRange = cm.getSelectedRange();
              if (
                selection.includes("\n")
                || selectedRange.from.line !== cm.lineCount() - 1
                || selectedRange.from.ch < 2
              ) {
                event.preventDefault();
              }
            }
            break;
          }
          case "Delete": {
            const cursor = cm.getCursor();
            if (
              cursor.line !== cm.lineCount() - 1
              || cursor.ch < 2
            ) {
              event.preventDefault();
            }
            break;
          }
          case "Enter": {
            cm.setCursor(cm.lineCount(), 0);
            event.preventDefault();
            const code = cm.doc.getLine(cm.doc.lastLine()).slice(2);
            this.appendToRepl("\n");
            this.runCode(code);
            break;
          }
          case "ArrowUp":
          case "ArrowDown":
          case "ArrowLeft":
          case "ArrowRight":
          case "Control":
          case "Shift": {
            break;
          }
          default: {
            const cursor = cm.getCursor();
            if (
              cursor.line !== cm.lineCount() - 1
              || cursor.ch < 2
            ) {
              cm.setCursor(cm.lineCount(), 0);
            }
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
    const lastLine = this.cm.lastLine();
    this.cm.replaceRange(text, CodeMirror.Pos(lastLine), null, `ignore ${className} ${(text.match(/\n/g) || "").length}`);
    this.cm.scrollIntoView(lastLine);
  }

  resetRepl() {
    this.cm.setValue("");
  }
}
