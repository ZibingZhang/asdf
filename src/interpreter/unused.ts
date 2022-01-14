import {
  ASTNodeVisitor,
  AndNode,
  AtomNode,
  CheckNode,
  CondNode,
  DefnStructNode,
  DefnVarNode,
  EllipsisFunAppNode,
  EllipsisNode,
  FunAppNode,
  IfNode,
  LambdaNode,
  OrNode,
  RequireNode,
  VarNode,
  LocalNode
} from "./ast";
import {
  Stage,
  StageOutput
} from "./pipeline";
import {
  Program
} from "./program";
import {
  SourceSpan
} from "./sourcespan";

export {
  UnusedCode
};

class UnusedCode implements ASTNodeVisitor<void>, Stage<Program, void> {
  constructor(readonly unusedCallback: (sourceSpan: SourceSpan) => void) {}

  run(input: StageOutput<Program>): StageOutput<void> {
    for (const node of input.output.nodes) {
      node.accept(this);
    }
    return new StageOutput(void(0));
  }

  visitAndNode(node: AndNode): void {
    if (!node.used) {
      if (!node.isTemplate()) {
        this.unusedCallback(node.sourceSpan);
      }
    } else {
      node.args.forEach(arg => arg.accept(this));
    }
  }

  visitAtomNode(node: AtomNode): void {
    if (!node.used) {
      this.unusedCallback(node.sourceSpan);
    }
  }

  visitCheckNode(node: CheckNode): void {
    if (!node.used) {
      this.unusedCallback(node.sourceSpan);
    }
  }

  visitCondNode(node: CondNode): void {
    if (!node.used) {
      if (!node.isTemplate()) {
        this.unusedCallback(node.sourceSpan);
      }
    } else {
      node.questionAnswerClauses.forEach(clause => {
        clause[0].accept(this);
        clause[1].accept(this);
      });
    }
  }

  visitDefnVarNode(node: DefnVarNode): void {
    if (!node.used) {
      if (!node.isTemplate()) {
        this.unusedCallback(node.sourceSpan);
      }
    } else {
      node.value.accept(this);
    }
  }

  visitDefnStructNode(_: DefnStructNode): void {
    // always used
  }

  visitEllipsisFunAllNode(_: EllipsisFunAppNode): void {
    // never used, yet always used
  }

  visitEllipsisNode(_: EllipsisNode): void {
    // never used, yet always used
  }

  visitFunAppNode(node: FunAppNode): void {
    if (!node.used) {
      if (!node.isTemplate()) {
        this.unusedCallback(node.sourceSpan);
      }
    } else {
      node.args.forEach(arg => arg.accept(this));
    }
  }

  visitIfNode(node: IfNode): void {
    if (!node.used) {
      if (!node.isTemplate()) {
        this.unusedCallback(node.sourceSpan);
      }
    } else {
      node.question.accept(this);
      node.trueAnswer.accept(this);
      node.falseAnswer.accept(this);
    }
  }

  visitLambdaNode(node: LambdaNode): void {
    if (!node.used) {
      if (!node.isTemplate()) {
        this.unusedCallback(node.sourceSpan);
      }
    } else {
      node.body.accept(this);
    }
  }

  visitLocalNode(node: LocalNode): void {
    if (!node.used) {
      if (!node.isTemplate) {
        this.unusedCallback(node.sourceSpan);
      }
    } else {
      node.defns.forEach(defn => defn.accept(this));
      node.body.accept(this);
    }
  }

  visitOrNode(node: OrNode): void {
    if (!node.used) {
      if (!node.isTemplate()) {
        this.unusedCallback(node.sourceSpan);
      }
    } else {
      node.args.forEach(arg => arg.accept(this));
    }
  }

  visitRequireNode(node: RequireNode): void {
    if (!node.used) {
      this.unusedCallback(node.sourceSpan);
    }
  }

  visitVarNode(node: VarNode): void {
    if (!node.used) {
      this.unusedCallback(node.sourceSpan);
    }
  }
}
