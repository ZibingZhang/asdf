const replTextArea = document.getElementById("repl");

const resetRepl = () => {
  repl.setValue("");
}
const appendToRepl = (text) => {
  repl.setValue(`${repl.getValue()}${text}\n`);
};

const repl = CodeMirror(
(elt) => {
  replTextArea.parentNode.replaceChild(elt, replTextArea);
}, {
  tabSize: 2,
  value: "",
  mode: null,
  theme: "monokai",
  readOnly: true,
  lineWrapping: true
});
