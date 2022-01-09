import {
  RTestResult,
  R_VOID
} from "./rvalue.js";
import {
  Stage,
  StageError,
  StageOutput,
  StageTestResult
} from "./pipeline.js";
import {
  Environment
} from "./environment.js";
import {
  NO_SOURCE_SPAN
} from "./sourcespan.js";
import {
  Program
} from "./program.js";
import {
  RT_MAX_CALL_STACK_SIZE_ERR
} from "./error.js";

export {
  EvaluateCode
};

class EvaluateCode implements Stage<Program, string[]> {
  private env: Environment = new Environment();
  private testResults: StageTestResult[] = [];

  reset() {
    this.env = new Environment();
  }

  run(input: StageOutput<Program>): StageOutput<string[]> {
    this.testResults = [];
    try {
      return new StageOutput(this.runHelper(input.output), [], this.testResults);
    } catch (e) {
      if (e instanceof StageError) {
        return new StageOutput([], [e], this.testResults);
      } else if (e instanceof Error && e.message === "too much recursion") {
        return new StageOutput(
          [],
          [
            new StageError(
              RT_MAX_CALL_STACK_SIZE_ERR,
              NO_SOURCE_SPAN
            )
          ],
          this.testResults
        );
      } else {
        throw e;
      }
    }
  }

  private runHelper(program: Program): string[] {
    const output: string[] = [];
    for (const node of program.nodes) {
      const result = node.eval(this.env);
      if (result instanceof RTestResult) {
        this.testResults.push(new StageTestResult(result.passed, result.msg));
      } else if (result !== R_VOID) {
        output.push(result.stringify());
      }
    }
    return output;
  }
}
