import {
  ASTNode,
  ASTNodeVisitor,
  AndNode,
  AtomNode,
  CheckErrorNode,
  CheckMemberOfNode,
  CheckNode,
  CheckRangeNode,
  CheckSatisfiedNode,
  CheckWithinNode,
  CondNode,
  DefnStructNode,
  DefnVarNode,
  EllipsisNode,
  EllipsisProcAppNode,
  IfNode,
  LambdaNode,
  LetNode,
  LocalNode,
  OrNode,
  ProcAppNode,
  RequireNode,
  VarNode
} from "../ir/ast";
import {
  Stage,
  StageOutput
} from "../data/stage";
import {
  Environment
} from "../data/environment";
import {
  Program
} from "../ir/program";

export {
  CompileCode
};

class CompileCode implements ASTNodeVisitor<string>, Stage<[Program, Map<string, ASTNode>], [string, Map<string, ASTNode>]> {
  env = new Environment();

  run(input: StageOutput<[Program, Map<string, ASTNode>]>): StageOutput<[string, Map<string, ASTNode>]> {
    const [program, labelNodeMap] = input.output;
    let topLevelLabels = program.nodes.map(node => node.label);
    let compiledCode = `
      let env = execEnv;
      let topLevelLabels = ${JSON.stringify(topLevelLabels)};
      while (topLevelLabels.length !== 0) {
        const topLevelLabel = topLevelLabels.shift();
        switch (topLevelLabel) {
    `;
    for (const [label, node] of labelNodeMap) {
      compiledCode += `
          case "${label}": {
            ${node.accept(this)};
            break;
          }
      `;
    }
    compiledCode += `
        }
      }
    `
    return new StageOutput([compiledCode, input.output[1]]);
  }

  visitAndNode(node: AndNode): string {
    return "";
  }

  visitAtomNode(node: AtomNode): string {
    return `rvals.push(lookupLabel("${node.label}").rval);`;
  }

  visitCheckNode(node: CheckNode): string {
    return "";
  }

  visitCheckErrorNode(node: CheckErrorNode): string {
    return "";
  }

  visitCheckMemberOfNode(node: CheckMemberOfNode): string {
    return "";
  }

  visitCheckRangeNode(node: CheckRangeNode): string {
    return "";
  }

  visitCheckSatisfiedNode(node: CheckSatisfiedNode): string {
    return "";
  }

  visitCheckWithinNode(node: CheckWithinNode): string {
    return "";
  }

  visitCondNode(node: CondNode): string {
    return "";
  }

  visitDefnStructNode(node: DefnStructNode): string {
    return "";
  }

  visitDefnVarNode(node: DefnVarNode): string {
    return "";
  }

  visitEllipsisProcAppNode(node: EllipsisProcAppNode): string {
    return "";
  }

  visitEllipsisNode(node: EllipsisNode): string {
    return "";
  }

  visitIfNode(node: IfNode): string {
    return "";
  }

  visitLambdaNode(node: LambdaNode): string {
    return "";
  }

  visitLetNode(node: LetNode): string {
    return "";
  }

  visitLocalNode(node: LocalNode): string {
    return "";
  }

  visitOrNode(node: OrNode): string {
    return "";
  }

  visitProcAppNode(node: ProcAppNode): string {
    return "";
  }

  visitRequireNode(node: RequireNode): string {
    return "";
  }

  visitVarNode(node: VarNode): string {
    return "rvals.push(env.get(node.name));";
    return "";
  }
}
