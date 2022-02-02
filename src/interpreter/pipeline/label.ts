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
  VarNode,
  CheckErrorNode,
  CheckMemberOfNode,
  CheckRangeNode,
  CheckSatisfiedNode,
  CheckWithinNode,
  ASTNode
} from "../ir/ast";
import {
  Stage,
  StageOutput
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

class GenerateLabels implements ASTNodeVisitor<void>, Stage<Program, [Program, Map<string, ASTNode>]> {
  global = new Global();
  currentInt = 0;
  labelNodeMap = new Map();

  run(input: StageOutput<Program>): StageOutput<[Program, Map<string, ASTNode>]> {
    this.currentInt = 0;
    this.labelNodeMap = new Map();
    input.output.nodes.forEach(node => node.accept(this));
    return new StageOutput([input.output, this.labelNodeMap]);
  }

  visitAndNode(node: AndNode): void {
    node.label = `and_${this.nextInt()}`;
    this.labelNodeMap.set(node.label, node);
    node.args.forEach(arg => arg.accept(this));
  }

  visitAtomNode(node: AtomNode): void {
    node.label = `atom_${this.nextInt()}`;
    this.labelNodeMap.set(node.label, node);
  }

  visitCheckNode(node: CheckNode): void {
    node.label = `check_${this.nextInt()}`;
    this.labelNodeMap.set(node.label, node);
    node.args.forEach(arg => arg.accept(this));
  }

  visitCheckErrorNode(node: CheckErrorNode): void {
    this.visitCheckNode(node);
  }

  visitCheckMemberOfNode(node: CheckMemberOfNode): void {
    this.visitCheckNode(node);
  }

  visitCheckRangeNode(node: CheckRangeNode): void {
    this.visitCheckNode(node);
  }

  visitCheckSatisfiedNode(node: CheckSatisfiedNode): void {
    this.visitCheckNode(node);
  }

  visitCheckWithinNode(node: CheckWithinNode): void {
    this.visitCheckNode(node);
  }

  visitCondNode(node: CondNode): void {
    node.label = `cond_${this.nextInt()}`;
    this.labelNodeMap.set(node.label, node);
    node.questionAnswerClauses.forEach(([question, answer]) => {
      question.accept(this);
      answer.accept(this);
    });
  }

  visitDefnStructNode(node: DefnStructNode): void {
    node.label = `defn_struct_${this.nextInt()}`;
    this.labelNodeMap.set(node.label, node);
  }

  visitDefnVarNode(node: DefnVarNode): void {
    node.label = `defn_var_${this.nextInt()}`;
    this.labelNodeMap.set(node.label, node);
    node.value.accept(this);
  }

  visitEllipsisProcAppNode(node: EllipsisProcAppNode): void {
    node.label = `ellipsis_proc_app_${this.nextInt()}`;
    this.labelNodeMap.set(node.label, node);
  }

  visitEllipsisNode(node: EllipsisNode): void {
    node.label = `ellipsis_${this.nextInt()}`;
    this.labelNodeMap.set(node.label, node);
  }

  visitIfNode(node: IfNode): void {
    node.label = `if_${this.nextInt()}`;
    this.labelNodeMap.set(node.label, node);
    node.question.accept(this);
    node.trueAnswer.accept(this);
    node.falseAnswer.accept(this);
  }

  visitLambdaNode(node: LambdaNode): void {
    node.label = `lambda_${this.nextInt()}`;
    this.labelNodeMap.set(node.label, node);
    node.body.accept(this);
  }

  visitLetNode(node: LetNode): void {
    node.label = `let_${this.nextInt()}`;
    this.labelNodeMap.set(node.label, node);
    node.bindings.forEach(([_, expr]) => expr.accept(this));
    node.body.accept(this);
  }

  visitLocalNode(node: LocalNode): void {
    node.label = `local_${this.nextInt()}`;
    this.labelNodeMap.set(node.label, node);
    node.defns.forEach(defn => defn.accept(this));
    node.body.accept(this);
  }

  visitOrNode(node: OrNode): void {
    node.label = `or_${this.nextInt()}`;
    this.labelNodeMap.set(node.label, node);
    node.args.forEach(arg => arg.accept(this));
  }

  visitProcAppNode(node: ProcAppNode): void {
    node.label = `proc_app_${this.nextInt()}`;
    this.labelNodeMap.set(node.label, node);
    node.fn.accept(this);
    node.args.forEach(arg => arg.accept(this));
  }

  visitRequireNode(node: RequireNode): void {
    node.label = `require_${this.nextInt()}`;
    this.labelNodeMap.set(node.label, node);
  }

  visitVarNode(node: VarNode): void {
    node.label = `var_${this.nextInt()}`;
    this.labelNodeMap.set(node.label, node);
  }

  private nextInt(): number {
    return this.currentInt++;
  }
}
