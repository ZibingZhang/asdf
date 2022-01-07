import {
  Environment
} from "./environment.js";
import {
  RT_MAX_CALL_STACK_SIZE_ERR
} from "./error.js";
import {
  Stage,
  StageError,
  StageOutput
} from "./pipeline.js";
import {
  DProgram,
  Program
} from "./program.js";
import { R_NONE } from "./rvalue.js";
import {
  NO_SOURCE_SPAN
} from "./sourcespan.js";

export {
  EVALUATE_CODE_STAGE
};

class EvaluateCode implements Stage<DProgram, string[]> {
  private env: Environment = new Environment();

  reset() {
    this.env = new Environment();
  }

  run(input: StageOutput<DProgram>): StageOutput<string[]> {
    try {
      return new StageOutput(this.runHelper(input.output));
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

  private runHelper(program: Program): string[] {
    const output: string[] = [];
    for (const node of program.nodes) {
      const result = node.eval(this.env);
      if (result !== R_NONE) {
        output.push(result.stringify());
      }
    }
    return output;
  }
}

const EVALUATE_CODE_STAGE = new EvaluateCode();
