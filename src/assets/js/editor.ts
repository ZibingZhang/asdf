import {
  SourceSpan
} from "../../interpreter/sourcespan";
import {
  Repl
} from "./repl";
import {
  resetTestOutput
} from "./test-output";

export {
  Editor
};

declare var CodeMirror: any;

class Editor {
  marked = false;
  cm: any;
  repl: Repl;

  constructor(elementId: string) {
    const textArea = document.getElementById(elementId) || new Element();
    this.cm = CodeMirror(
      (elt: HTMLElement) => {
        textArea.parentNode?.replaceChild(elt, textArea);
      }, {
        lineNumbers: true,
        tabSize: 2,
        mode: "racket",
        theme: "racket",
        styleSelectedText: true,
        extraKeys: {
          "Alt-Enter": () => this.runEditorCode()
        }
      }
    );
    this.cm.on("changes", () => this.unmark());
  }

  registerRepl(repl: Repl) {
    this.repl = repl;
  }

  mark(sourceSpan: SourceSpan, className: string) {
    this.marked = true;
    this.cm.markText(
      { line: sourceSpan.startLineno - 1, ch: sourceSpan.startColno },
      { line: sourceSpan.endLineno - 1, ch: sourceSpan.endColno },
      { className }
    );
  }

  unmark() {
    if (this.marked) {
      this.cm.doc.getAllMarks().forEach((mark: any) => mark.clear());
      this.marked = false;
    }
  }

  runEditorCode() {
    this.unmark();
    this.repl.resetRepl();
    resetTestOutput();
    window.racket.pipeline.reset();
    window.racket.pipeline.setErrorsCallback(stageErrors => {
      window.racket.pipeline.reset();
      let replOutput = "";
      for (const stageError of stageErrors) {
        this.mark(stageError.sourceSpan, "cm-highlight-error");
        replOutput += stageError.msg + "\n";
      }
      replOutput += "> ";
      this.repl.appendToRepl(replOutput, "cm-highlight-error-message");
    });
    window.racket.pipeline.setUnusedCallback(sourceSpan => this.mark(sourceSpan, "cm-highlight-unused"));
    window.racket.pipeline.evaluateCode(this.cm.getValue());
  }
}
