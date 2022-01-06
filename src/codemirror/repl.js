const replTextArea = document.getElementById("repl");
const repl = CodeMirror(
(elt) => {
  replTextArea.parentNode.replaceChild(elt, replTextArea);
}, {
  tabSize: 2,
  value: "> ",
  mode: null,
  theme: "monokai",
  lineWrapping: true,
  smartIndent: false
});

const resetRepl =
  () => repl.setValue("");
const appendToRepl =
  text => repl.replaceRange(text, CodeMirror.Pos(repl.lastLine()));
const appendToReplLn =
  text => appendToRepl(`${text}\n`);

repl.on("cursorActivity",
  repl => repl.setCursor(repl.lineCount(), 0)
);
repl.on("keydown",
  (_, event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      appendToReplLn("");
      const lastLine = repl.getLine(repl.lastLine() - 1).slice(2);
      const result = window.pipelines.evaluateRepl.run(lastLine);
      if (result.errors.length > 0) {
        for (const error of result.errors) {
          const location = `${error.sourcespan.startLineno}:${error.sourcespan.startColno}`;
          appendToReplLn(`[${location}] ${error.msg}`);
        }
      } else {
        for (const text of result.output) {
          appendToReplLn(text);
        }
      }
      appendToRepl("> ");
    }
  }
);
