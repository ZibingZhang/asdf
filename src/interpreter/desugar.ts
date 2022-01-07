import {
  DASTNode,
  DefnStructNode,
  DefnVarNode,
  isDefnNode,
  LambdaNode,
  MakeStructNode
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
  DESUGAR_STAGE
};

class Desugar implements Stage<Program, DProgram> {
  run(input: StageOutput<Program>): StageOutput<DProgram> {
    const defns: DefnVarNode[] = [];
    const nodes: DASTNode[] = [];
    for (const node of input.output.nodes) {
      if (isDefnNode(node)) {
        if (node instanceof DefnStructNode) {
          const structName = node.name;
          const structNodes = [];
          structNodes.push(new DefnVarNode(
            `make-${structName}`,
            node.sourceSpan,
            new MakeStructNode(
              structName,
              node.params.length,
              node.sourceSpan
            ),
            node.sourceSpan
          ));
          for (const node of structNodes) {
            defns.push(node);
            nodes.push(node);
          }
        } else {
          defns.push(node);
          nodes.push(node);
        }
      } else {
        nodes.push(node);
      }
    }
    return new StageOutput(new DProgram(defns, nodes));
  }
}

const DESUGAR_STAGE = new Desugar();
