/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  StageTestResult
} from "../../interpreter/pipeline";

export {
  TestOutput
};

declare let CodeMirror: any;

class TestOutput {
  cm: any;
  failedTests = 0;
  totalTests = 0;

  constructor(elementId: string) {
    const textArea = <HTMLElement>document.getElementById(elementId);
    this.cm = CodeMirror(
      (elt: HTMLElement) => {
        textArea.parentNode?.replaceChild(elt, textArea);
      }, {
        lineNumbers: false,
        readOnly: true,
        tabSize: 2,
        value: "\n\n\n",
        mode: "text"
      }
    );
  }

  appendToTestOutputLn(text: string) {
    this.cm.replaceRange(`${text}\n`, CodeMirror.Pos(this.cm.lastLine()));
  }

  resetTestOutput() {
    this.cm.setValue("\n\n\n");
    this.failedTests = 0;
    this.totalTests = 0;
  }

  handleTestResults(tests: StageTestResult[]) {
    const newFailures = [];
    for (const test of tests) {
      this.totalTests++;
      if (!test.passed) {
        this.failedTests++;
        newFailures.push(test);
      }
    }
    if (this.totalTests > 0) {
      this.cm.replaceRange(
        `Ran ${this.totalTests} test${this.totalTests > 1 ? "s" : ""}.`,
        { line: 0, ch: 0 },
        { line: 0 }
      );
      let testsPassedOrFailed;
      if (this.failedTests === 0) {
        if (this.totalTests === 1) {
          testsPassedOrFailed = "The test passed!";
        } else if (this.totalTests === 2) {
          testsPassedOrFailed = "Both test passed!";
        } else {
          testsPassedOrFailed = `All ${this.totalTests} tests passed!`;
        }
      } else if (this.failedTests === this.totalTests) {
        testsPassedOrFailed = "0 tests passed.";
      } else {
        testsPassedOrFailed = `${this.failedTests} of the ${this.totalTests} tests failed.`;
      }
      this.cm.replaceRange(
        testsPassedOrFailed,
        { line: 1, ch: 0 },
        { line: 1 }
      );
    }
    if (this.failedTests > 0 && this.failedTests === newFailures.length) {
      this.appendToTestOutputLn("Check failures:");
    }
    newFailures.forEach(test => this.appendToTestOutputLn(`  ${test.errMsg.replace("\n", "\n  ")}\n    at line ${test.sourceSpan.startLineno}, column ${test.sourceSpan.startColno}`));
  }
}
