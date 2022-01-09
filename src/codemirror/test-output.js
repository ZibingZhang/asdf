export {
  resetTestOutput,
  handleTestResults
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

const appendToTestOutput =
  text => testOutput.replaceRange(text, CodeMirror.Pos(testOutput.lastLine()));
const appendToTestOutputLn =
  text => appendToTestOutput(`${text}\n`);

let failedTests = 0;
let totalTests = 0;

function resetTestOutput() {
  testOutput.setValue("\n\n\n");
  failedTests = 0;
  totalTests = 0;
}

function handleTestResults(tests) {
  const newFailures = [];
  for (const test of tests) {
    totalTests++;
    if (!test.passed) {
      failedTests++;
      newFailures.push(test.errMsg);
    }
  }
  if (totalTests > 0) {
    testOutput.replaceRange(
      `Ran ${totalTests} test${totalTests > 1 ? "s" : ""}.`,
      { line: 0, ch: 0 },
      { line: 0 }
    );
    let testsPassedOrFailed;
    if (failedTests === 0) {
      testsPassedOrFailed = "All tests passed!";
    } else if (failedTests === totalTests) {
      testsPassedOrFailed = "0 tests passed.";
    } else {
      testsPassedOrFailed = `${failedTests} of the ${totalTests} tests failed.`;
    }
    testOutput.replaceRange(
      testsPassedOrFailed,
      { line: 1, ch: 0 },
      { line: 1 }
    );
  }
  if (failedTests > 0 && failedTests === newFailures.length) {
    appendToTestOutputLn("Check failures:");
  }
  newFailures.forEach(errMsg => appendToTestOutputLn(`                    ${errMsg.replace("\n", "\n                    ")}`));
}
