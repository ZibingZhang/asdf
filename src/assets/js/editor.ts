/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Controller
} from "./controller";
import {
  SourceSpan
} from "../../interpreter/data/sourcespan";

export {
  Editor
};

declare let CodeMirror: CodeMirror;

class Editor {
  marked = false;
  cm: CodeMirror;
  controller: Controller;

  constructor(elementId: string) {
    const textArea = <HTMLElement>document.getElementById(elementId);
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
          "Alt-Enter": () => this.runCode(),
          "Ctrl-/": () => this.cm.execCommand("toggleComment")
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
      this.controller.repl.append(replOutput, "cm-highlight-error-message");
    });
    window.racket.pipeline.setUnusedCallback(sourceSpan => this.mark(sourceSpan, "cm-highlight-unused"));
    window.racket.pipeline.evaluateCode(this.cm.getValue());
  }
}
