import {
  ASTNodeVisitor,
  AndNode,
  AtomNode,
  CheckNode,
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
  StageResult,
  makeStageResult
} from "../data/stage";
import {
  Global
} from "../global";
import {
  Program
} from "../ir/program";

export {
  GenerateLabels
};

class GenerateLabels implements ASTNodeVisitor<void>, Stage<Program, void> {
  global = new Global();
  currentInt = 0;

  run(result: StageResult<Program>): StageResult<void> {
    this.currentInt = 0;
    result.output.nodes.forEach(node => node.accept(this));
    return makeStageResult(void null);
  }

  visitAndNode(node: AndNode): void {
    node.label = `and_${this.nextInt()}`;
    node.args.forEach(arg => arg.accept(this));
  }

  visitAtomNode(node: AtomNode): void {
    node.label = `atom_${this.nextInt()}`;
  }

  visitCheckNode(node: CheckNode): void {
    node.label = `check_${this.nextInt()}`;
    node.args.forEach(arg => arg.accept(this));
  }

  visitCondNode(node: CondNode): void {
    node.label = `cond_${this.nextInt()}`;
    node.questionAnswerClauses.forEach(([question, answer]) => {
      question.accept(this);
      answer.accept(this);
    });
  }

  visitDefnStructNode(node: DefnStructNode): void {
    node.label = `defn_struct_${this.nextInt()}`;
  }

  visitDefnVarNode(node: DefnVarNode): void {
    node.label = `defn_var_${this.nextInt()}`;
    node.value.accept(this);
  }

  visitEllipsisProcAppNode(node: EllipsisProcAppNode): void {
    node.label = `ellipsis_proc_app_${this.nextInt()}`;
  }

  visitEllipsisNode(node: EllipsisNode): void {
    node.label = `ellipsis_${this.nextInt()}`;
  }

  visitIfNode(node: IfNode): void {
    node.label = `if_${this.nextInt()}`;
    node.question.accept(this);
    node.trueAnswer.accept(this);
    node.falseAnswer.accept(this);
  }

  visitLambdaNode(node: LambdaNode): void {
    node.label = `lambda_${this.nextInt()}`;
    node.body.accept(this);
  }

  visitLetNode(node: LetNode): void {
    node.label = `let_${this.nextInt()}`;
    node.bindings.forEach(([_, expr]) => expr.accept(this));
    node.body.accept(this);
  }

  visitLocalNode(node: LocalNode): void {
    node.label = `local_${this.nextInt()}`;
    node.defns.forEach(defn => defn.accept(this));
    node.body.accept(this);
  }

  visitOrNode(node: OrNode): void {
    node.label = `or_${this.nextInt()}`;
    node.args.forEach(arg => arg.accept(this));
  }

  visitProcAppNode(node: ProcAppNode): void {
    node.label = `proc_app_${this.nextInt()}`;
    node.fn.accept(this);
    node.args.forEach(arg => arg.accept(this));
  }

  visitRequireNode(node: RequireNode): void {
    node.label = `require_${this.nextInt()}`;
  }

  visitVarNode(node: VarNode): void {
    node.label = `var_${this.nextInt()}`;
  }

  private nextInt(): number {
    return this.currentInt++;
  }
}
