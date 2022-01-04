import {
  isDefnNode
} from "./ast.js";
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
  private env: Environment = PRIMITIVE_ENVIRONMENT;

  run(input: StageOutput): StageOutput {
    this.env = new Environment(PRIMITIVE_ENVIRONMENT);

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
    for (const node of program.nodes) {
      if (isDefnNode(node)) {
        node.run(this.env);
      } else {
        output.push(node.eval(this.env).stringify());
      }

    }
    return output;
  }
}
