import {
  evaluate
} from "./common.js";
import {
  resetRepl
} from "./repl.js";

const initValue =
`;; Source code at https://github.com/ZibingZhang/racket-online-ide
;; Use \`Alt-Enter' to run the code
`;
const editorTextArea = document.getElementById("editor");
const editor = CodeMirror(
(elt) => {
  editorTextArea.parentNode.replaceChild(elt, editorTextArea);
}, {
lineNumbers: true,
tabSize: 2,
value: initValue,
mode: "racket",
theme: "monokai",
extraKeys: {
  "Alt-Enter": () => {
    resetRepl();
    evaluate(
      window.pipelines.evaluateProgram,
      editor.getValue(),
      true
    );
  }
}});
