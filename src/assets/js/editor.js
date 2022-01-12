import {
  runEditorCode
} from "./common";

export {
  EDITOR,
  markEditor
};

const editorTextArea = document.getElementById("editor-textarea");
const EDITOR = CodeMirror(
  (elt) => {
    editorTextArea.parentNode.replaceChild(elt, editorTextArea);
  }, {
    lineNumbers: true,
    tabSize: 2,
    mode: "racket",
    extraKeys: {
      "Alt-Enter": () => runEditorCode()
    }
  }
);

let editorMarked = false;
function markEditor(sourceSpan) {
  editorMarked = true;
  EDITOR.markText(
    { line: sourceSpan.startLineno - 1, ch: sourceSpan.startColno },
    { line: sourceSpan.endLineno - 1, ch: sourceSpan.endColno },
    { className: "cm-highlight-error" }
  );
}

EDITOR.on("changes",
  cm => {
    if (editorMarked) {
      cm.doc.getAllMarks().forEach(marker => marker.clear());
    }
  }
);
