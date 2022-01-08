import {
  appendToRepl
} from "./repl.js";
import {
  appendToTestOutputLn,
  resetTestOutput,
  setTestOutputFirstLine,
  setTestOutputSecondLine
} from "./test-output.js";

export {
  evaluate
};

let failedTests = 0;
let totalTests = 0;

function evaluate(pipeline, text, clearTestOutput) {
  if (clearTestOutput) {
    resetTestOutput();
    failedTests = 0;
    totalTests = 0;
  }
  const stageOutput = pipeline.run(text);
  let output = "";
  if (stageOutput.errors.length > 0) {
    for (const error of stageOutput.errors) {
      output += error.msg + "\n";
    }
  } else {
    for (const text of stageOutput.output) {
      output += text + "\n";
    }
    const newFailures = [];
    for (const test of stageOutput.tests) {
      totalTests++;
      if (!test.passed) {
        failedTests++;
        newFailures.push(test.errMsg);
      }
    }
    if (totalTests > 0) {
      setTestOutputFirstLine(`Ran ${totalTests} test${totalTests > 1 ? "s" : ""}.`);
      if (failedTests === 0) {
        setTestOutputSecondLine("All tests passed!");
      } else if (failedTests === totalTests) {
        setTestOutputSecondLine("0 tests passed.");
      } else {
        setTestOutputSecondLine(`${failedTests} of the ${totalTests} tests failed.`);
      }
    }
    if (failedTests > 0 && failedTests === newFailures.length) {
      appendToTestOutputLn("Check failures:");
    }
    for (const errMsg of newFailures) {
      appendToTestOutputLn(`                    ${errMsg}`);
    }
  }
  output += "> ";
  appendToRepl(output);
}
