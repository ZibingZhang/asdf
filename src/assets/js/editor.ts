import {
  SourceSpan
} from "../../interpreter/sourcespan";
import {
  Controller
} from "./controller";

export {
  Editor
};

declare var CodeMirror: any;

class Editor {
  marked = false;
  cm: any;
  controller: Controller;

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
          "Alt-Enter": () => this.runCode()
        }
      }
    );
    this.cm.on("changes", () => this.unmark());
  }

  registerController(controller: Controller) {
    this.controller = controller;
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

  runCode() {
    this.unmark();
    this.controller.repl.resetRepl();
    this.controller.testOutput.resetTestOutput();
    window.racket.pipeline.reset();
    window.racket.pipeline.setErrorsCallback(stageErrors => {
      window.racket.pipeline.reset();
      let replOutput = "";
      for (const stageError of stageErrors) {
        this.mark(stageError.sourceSpan, "cm-highlight-error");
        replOutput += stageError.msg + "\n";
      }
      replOutput += "> ";
      this.controller.repl.appendToRepl(replOutput, "cm-highlight-error-message");
    });
    window.racket.pipeline.setUnusedCallback(sourceSpan => this.mark(sourceSpan, "cm-highlight-unused"));
    window.racket.pipeline.evaluateCode(this.cm.getValue());
  }
}
