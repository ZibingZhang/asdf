import {
  appendToRepl,
  resetRepl
} from "./repl";
import {
  resetTestOutput
} from "./test-output";

export {
  EDITOR,
  markEditor,
  runEditorCode
};

const editorTextArea = document.getElementById("editor-textarea");
const EDITOR = CodeMirror(
  (elt) => {
    editorTextArea.parentNode.replaceChild(elt, editorTextArea);
  }, {
    lineNumbers: true,
    tabSize: 2,
    mode: "racket",
    theme: "racket",
    styleSelectedText: true,
    extraKeys: {
      "Alt-Enter": () => runEditorCode()
    }
  }
);
EDITOR.on("changes",
  (cm) => {
    if (editorMarked) {
      cm.doc.getAllMarks().forEach(marker => marker.clear());
    }
  }
);

function runEditorCode() {
  resetRepl();
  resetTestOutput();
  window.racket.pipeline.reset();
  window.racket.pipeline.setErrorsCallback(stageErrors => {
    window.racket.pipeline.reset();
    let replOutput = "";
    for (const stageError of stageErrors) {
      markEditor(stageError.sourceSpan, "cm-highlight-error");
      replOutput += stageError.msg + "\n";
    }
    replOutput += "> ";
    appendToRepl(replOutput, "cm-highlight-error-message");
  });
  window.racket.pipeline.setUnusedCallback(sourceSpan => markEditor(sourceSpan, "cm-highlight-unused"))
  window.racket.pipeline.evaluateCode(EDITOR.getValue());
}

let editorMarked = false;
function markEditor(sourceSpan, className) {
  editorMarked = true;
  EDITOR.markText(
    { line: sourceSpan.startLineno - 1, ch: sourceSpan.startColno },
    { line: sourceSpan.endLineno - 1, ch: sourceSpan.endColno },
    { className }
  );
}
