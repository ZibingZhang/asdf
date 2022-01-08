import {
  Environment
} from "./environment.js";
import {
  RT_MAX_CALL_STACK_SIZE_ERR
} from "./error.js";
import {
  Stage,
  StageError,
  StageOutput,
  StageTestResult
} from "./pipeline.js";
import {
  Program
} from "./program.js";
import {
  RTestResult,
  R_VOID
} from "./rvalue.js";
import {
  NO_SOURCE_SPAN
} from "./sourcespan.js";

export {
  EvaluateCode
};

class EvaluateCode implements Stage<Program, string[]> {
  private env: Environment = new Environment();

  reset() {
    this.env = new Environment();
  }

  run(input: StageOutput<Program>): StageOutput<string[]> {
    try {
      return this.runHelper(input.output);
    } catch (e) {
      if (e instanceof StageError) {
        return new StageOutput([], [e]);
      } else if (e instanceof Error && e.message === "too much recursion") {
        return new StageOutput(
          [],
          [
            new StageError(
              RT_MAX_CALL_STACK_SIZE_ERR,
              NO_SOURCE_SPAN
            )
          ]
        );
      } else {
        throw e;
      }
    }
  }

  private runHelper(program: Program): StageOutput<string[]> {
    const output: string[] = [];
    const testResults: StageTestResult[] = [];
    for (const node of program.nodes) {
      const result = node.eval(this.env);
      if (result instanceof RTestResult) {
        testResults.push(new StageTestResult(result.passed, result.msg));
      } else if (result !== R_VOID) {
        output.push(result.stringify());
      }
    }
    return new StageOutput(output, [], testResults);
  }
}
