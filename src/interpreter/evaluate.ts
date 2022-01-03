import { BASE_ENVIRONMENT, Environment } from "./environment.js";
import { Stage, StageError, StageOutput } from "./pipeline.js";
import { Program } from "./program.js";

export {
  EvaluateProgram
};

class EvaluateError extends Error {
  constructor(readonly stageError: StageError) {
    super(stageError.msg);
  }
}

class EvaluateProgram implements Stage {
  private env: Environment;

  constructor() {
    this.env = BASE_ENVIRONMENT;
  }

  run(input: StageOutput): StageOutput {
    this.env = BASE_ENVIRONMENT;

    try {
      return new StageOutput(this.runHelper(input.output));
    } catch (e) {
      if (e instanceof EvaluateError) {
        return new StageOutput(null, [e.stageError]);
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
