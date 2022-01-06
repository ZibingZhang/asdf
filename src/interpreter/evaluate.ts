import {
  isDefnNode
} from "./ast.js";
import {
  Environment
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
  private env: Environment = <Environment><unknown>null;

  run(input: StageOutput): StageOutput {
    this.env = new Environment();

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
