export {
  resetTestOutput,
  appendToTestOutput,
  appendToTestOutputLn,
  setTestOutputFirstLine,
  setTestOutputSecondLine
};

const testOutputTextArea = document.getElementById("test-output");
const testOutput = CodeMirror(
(elt) => {
  testOutputTextArea.parentNode.replaceChild(elt, testOutputTextArea);
}, {
lineNumbers: false,
tabSize: 2,
value: "\n\n\n",
mode: null,
theme: "monokai",
readOnly: true
});

const resetTestOutput =
  () => testOutput.setValue("\n\n\n");
const appendToTestOutput =
  text => testOutput.replaceRange(text, CodeMirror.Pos(testOutput.lastLine()));
const appendToTestOutputLn =
  text => appendToTestOutput(`${text}\n`);
const setTestOutputFirstLine =
  text => testOutput.replaceRange(`${text}`, { line: 0, ch: 0 }, { line: 0 });
const setTestOutputSecondLine =
  text => testOutput.replaceRange(`${text}`, { line: 1, ch: 0 }, { line: 1 });
