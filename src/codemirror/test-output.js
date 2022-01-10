export {
  handleTestResults,
  resetTestOutput
};

const testOutputTextArea = document.getElementById("test-output-textarea");
const TEST_OUTPUT = CodeMirror(
  (elt) => {
    testOutputTextArea.parentNode.replaceChild(elt, testOutputTextArea);
  }, {
    lineNumbers: false,
    tabSize: 2,
    value: "\n\n\n",
    mode: null,
    readOnly: true
  }
);

const appendToTestOutput =
  text => TEST_OUTPUT.replaceRange(text, CodeMirror.Pos(TEST_OUTPUT.lastLine()));
const appendToTestOutputLn =
  text => appendToTestOutput(`${text}\n`);

let failedTests = 0;
let totalTests = 0;

function resetTestOutput() {
  TEST_OUTPUT.setValue("\n\n\n");
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
    TEST_OUTPUT.replaceRange(
      `Ran ${totalTests} test${totalTests > 1 ? "s" : ""}.`,
      { line: 0, ch: 0 },
      { line: 0 }
    );
    let testsPassedOrFailed;
    if (failedTests === 0) {
      if (totalTests === 1) {
        testsPassedOrFailed = "The test passed!";
      } else if (totalTests === 2) {
        testsPassedOrFailed = "Both test passed!";
      } else {
        testsPassedOrFailed = `All ${totalTests} tests passed!`;
      }
    } else if (failedTests === totalTests) {
      testsPassedOrFailed = "0 tests passed.";
    } else {
      testsPassedOrFailed = `${failedTests} of the ${totalTests} tests failed.`;
    }
    TEST_OUTPUT.replaceRange(
      testsPassedOrFailed,
      { line: 1, ch: 0 },
      { line: 1 }
    );
  }
  if (failedTests > 0 && failedTests === newFailures.length) {
    appendToTestOutputLn("Check failures:");
  }
  newFailures.forEach(errMsg => appendToTestOutputLn(`  ${errMsg.replace("\n", "\n  ")}`));
}
