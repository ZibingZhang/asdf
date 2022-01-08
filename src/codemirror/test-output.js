export {
  resetTestOutput,
  appendToTestOutput,
  appendToTestOutputLn
};

const testOutputTextArea = document.getElementById("test-output");
const testOutput = CodeMirror(
(elt) => {
  testOutputTextArea.parentNode.replaceChild(elt, testOutputTextArea);
}, {
lineNumbers: false,
tabSize: 2,
value: "",
mode: null,
theme: "monokai",
readOnly: true
});

const resetTestOutput =
  () => testOutput.setValue("");
const appendToTestOutput =
  text => testOutput.replaceRange(text, CodeMirror.Pos(testOutput.lastLine()));
const appendToTestOutputLn =
  text => appendToTestOutput(`${text}\n`);
