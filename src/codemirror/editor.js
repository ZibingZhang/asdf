const editorTextArea = document.getElementById("editor");
const editor = CodeMirror(
(elt) => {
  editorTextArea.parentNode.replaceChild(elt, editorTextArea);
}, {
lineNumbers: true,
tabSize: 2,
value: "(+ 1 2)",
mode: "racket",
theme: "monokai",
extraKeys: {
  "Alt-Enter": () => {
    const result = window.pipelines.evaluateProgram.run(editor.getValue());
    resetRepl();
    if (result.errors.length > 0) {
      for (const error of result.errors) {
        const location = `${error.sourcespan.startLineno}:${error.sourcespan.startColno}`;
        appendToRepl(`[${location}] ${error.msg}`);
      }
    } else {
      for (const text of result.output) {
        appendToRepl(text);
      }
    }
  }
}});
