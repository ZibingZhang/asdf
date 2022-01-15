import {
  ASTNodeVisitor,
  AndNode,
  AtomNode,
  CheckNode,
  CondNode,
  DefnNode,
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
  LocalNode,
  LetNode
} from "./ast";
import {
  DATA_VARIABLE_META,
  Scope,
  STRUCTURE_TYPE_VARIABLE_META,
  VariableMeta,
  VariableType
} from "./scope";
import {
  DF_PREVIOUSLY_DEFINED_NAME_ERR,
  FA_ARITY_ERR,
  LO_ALREADY_DEFINED_LOCALLY_ERR,
  RQ_MODULE_NOT_FOUND_ERR,
  SC_UNDEFINED_VARIABLE_ERR,
  WF_EXPECTED_FUNCTION_CALL_ERR,
  WF_STRUCTURE_TYPE_ERR
} from "./error";
import {
  Stage,
  StageError,
  StageOutput
} from "./pipeline";
import {
  Program
} from "./program";

export {
  WellFormedProgram
};

class WellFormedProgram implements ASTNodeVisitor<void>, Stage<Program, Program> {
  scope: Scope = new Scope();

  reset() {
    this.scope = new Scope();
  }

  run(input: StageOutput<Program>): StageOutput<Program> {
    try {
      this.assertWellFormedProgram(input.output);
      return input;
    } catch (e) {
      if (e instanceof StageError) {
        return new StageOutput(<Program><unknown>null, [e]);
      } else {
        throw e;
      }
    }
  }

  visitAndNode(node: AndNode): void {
    node.args.forEach(arg => arg.accept(this));
  }

  visitAtomNode(_: AtomNode): void {
    // always well-formed
  }

  visitCheckNode(node: CheckNode): void {
    node.args.forEach(arg => arg.accept(this));
  }

  visitCondNode(node: CondNode): void {
    node.questionAnswerClauses.forEach(([question, answer]) => {
      question.accept(this);
      answer.accept(this);
    });
  }

  visitDefnVarNode(node: DefnVarNode): void {
    node.value.accept(this);
  }

  visitDefnStructNode(_: DefnStructNode): void {
    // always well-formed
  }

  visitEllipsisFunAllNode(_: EllipsisFunAppNode): void {
    // skip well-formed check on template
  }

  visitEllipsisNode(_: EllipsisNode): void {
    // skip well-formed check on template
  }

  visitFunAppNode(node: FunAppNode): void {
    const meta = this.scope.get(node.fn.name, false, node.fn.sourceSpan);
    if (meta.type === VariableType.UserDefinedFunction && meta.arity != node.args.length) {
      throw new StageError(
        FA_ARITY_ERR(node.fn.name, meta.arity, node.args.length),
        node.sourceSpan
      );
    }
    node.args.forEach(arg => arg.accept(this));
  }

  visitIfNode(node: IfNode): void {
    node.question.accept(this);
    node.trueAnswer.accept(this);
    node.falseAnswer.accept(this);
  }

  visitLambdaNode(node: LambdaNode): void {
    const outerScope = this.scope;
    this.scope = new Scope(this.scope);
    node.params.forEach(param => this.scope.add(param, DATA_VARIABLE_META));
    node.body.accept(this);
    this.scope = outerScope;
  }

  visitLetNode(node: LetNode): void {
      throw "TODO";
  }

  visitLocalNode(node: LocalNode): void {
    const names: Set<string> = new Set();
    const childScope = new Scope(this.scope);
    node.defns.forEach(defn => {
      if (names.has(defn.name)) {
        throw new StageError(
          LO_ALREADY_DEFINED_LOCALLY_ERR(defn.name),
          defn.nameSourceSpan
        );
      }
      names.add(defn.name);
      defn.addToScope(childScope, true)
    });
    const scope = this.scope;
    this.scope = childScope;
    node.defns.forEach(defn => defn.accept(this));
    node.body.accept(this);
    this.scope = scope;
  }

  visitOrNode(node: OrNode): void {
    node.args.forEach(arg => arg.accept(this));
  }

  visitRequireNode(node: RequireNode): void {
    throw new StageError(
      RQ_MODULE_NOT_FOUND_ERR(node.name),
      node.nameSourceSpan
    );
  }

  visitVarNode(node: VarNode): void {
    const meta = this.scope.get(node.name, true, node.sourceSpan);
    if (meta.type === VariableType.StructureType) {
      throw new StageError(
        WF_STRUCTURE_TYPE_ERR(node.name),
        node.sourceSpan
      );
    }
    if (meta.type !== VariableType.Data) {
      throw new StageError(
        WF_EXPECTED_FUNCTION_CALL_ERR(node.name),
        node.sourceSpan
      );
    }
    if (!this.scope.has(node.name)) {
      throw new StageError(
        SC_UNDEFINED_VARIABLE_ERR(node.name),
        node.sourceSpan
      );
    }
  }

  private assertWellFormedProgram(program: Program) {
    this.addDefinitionsToScope(program.defns);
    program.nodes.forEach(node => node.accept(this));
  }

  private addDefinitionsToScope(defns: DefnNode[]) {
    for (const defn of defns) {
      defn.addToScope(this.scope);
    }
  }
}
