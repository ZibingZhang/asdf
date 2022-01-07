import {
  ASTNode,
  DefnNode,
  isDefnNode
} from "./ast.js";
import {
  Stage,
  StageOutput
} from "./pipeline.js";
import {
  DProgram,
  Program
} from "./program.js";

export {
  Desugar
};

class Desugar implements Stage<Program, DProgram> {
  run(input: StageOutput<Program>): StageOutput<DProgram> {
    const defns: DefnNode[] = [];
    const nodes: ASTNode[] = [];
    for (const node of input.output.nodes) {
      if (isDefnNode(node)) {
        defns.push(node);
        nodes.push(node);
      } else {
        nodes.push(node);
      }
    }
    return new StageOutput(new DProgram(defns, nodes));
  }
}
