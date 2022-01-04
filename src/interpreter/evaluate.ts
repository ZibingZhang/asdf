import {
  Environment,
  PRIMITIVE_ENVIRONMENT
} from "./environment.js";
import {
  Stage,
  StageError,
  StageOutput
} from "./pipeline.js";
import {
  Program
} from "./program.js";

export {
  EvaluateProgram
};

class EvaluateProgram implements Stage {
  private env: Environment;

  constructor() {
    this.env = PRIMITIVE_ENVIRONMENT;
  }

  run(input: StageOutput): StageOutput {
    this.env = PRIMITIVE_ENVIRONMENT;

    try {
      return new StageOutput(this.runHelper(input.output));
    } catch (e) {
      if (e instanceof StageError) {
        return new StageOutput(null, [e]);
      } else {
        throw e;
      }
    }
  }

  private runHelper(program: Program): string[] {
    const output: string[] = [];
    for (const expr of program.exprs) {
      output.push(expr.eval(this.env).stringify());
    }
    return output;
  }
}
