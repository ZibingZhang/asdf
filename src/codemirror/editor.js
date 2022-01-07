import {
  evaluate
} from "./common.js";
import {
  appendToRepl,
  resetRepl
} from "./repl.js";

const initValue = ";; Use `Alt-Enter' to run the code\n";
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
    const result = evaluate(editor.getValue());
    appendToRepl(result);
  }
}});
