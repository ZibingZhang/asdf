import {
  ASTNodeVisitor,
  AndNode,
  AtomNode,
  CheckNode,
  CondNode,
  DefnNode,
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
  CE_TEST_NOT_TOP_LEVEL_ERR,
  LT_ALREADY_DEFINED_LOCALLY_ERR,
  RQ_NOT_TOP_LEVEL_ERR,
  SC_UNDEFINED_VARIABLE_ERR,
  WF_EXPECTED_FUNCTION_CALL_ERR,
  WF_NOT_TOP_LEVEL_DEFN_ERR,
  WF_STRUCTURE_TYPE_ERR
} from "../error";
import {
  Scope,
  VariableType
} from "../data/scope";
import {
  Stage,
  StageError,
  StageResult,
  makeStageResult
} from "../data/stage";
import {
  Keyword
} from "../data/keyword";
import {
  Program
} from "../ir/program";
import {
  SETTINGS
} from "../settings";

export {
  WellFormedProgram
};

class WellFormedProgram implements ASTNodeVisitor<void>, Stage<Program, Program> {
  private level = 0;
  private scope: Scope = new Scope();

  reset() {
    this.scope = new Scope();
  }

  run(result: StageResult<Program>): StageResult<Program> {
    try {
      this.assertWellFormedProgram(result.output);
      return result;
    } catch (e) {
      if (e instanceof StageError) {
        return makeStageResult(<Program><unknown>null, [e]);
      } else {
        throw e;
      }
    }
  }

  visitAndNode(node: AndNode): void {
    this.incrementLevel();
    node.args.forEach(arg => arg.accept(this));
  }

  visitAtomNode(_: AtomNode): void {
    // always well-formed
  }

  visitCheckNode(node: CheckNode): void {
    if (!this.atTopLevel()) {
      throw new StageError(
        CE_TEST_NOT_TOP_LEVEL_ERR(node.name),
        node.sourceSpan
      );
    }
    this.incrementLevel();
    node.args.forEach(arg => arg.accept(this));
  }

  visitCondNode(node: CondNode): void {
    this.incrementLevel();
    node.questionAnswerClauses.forEach(([question, answer]) => {
      question.accept(this);
      answer.accept(this);
    });
  }

  visitDefnVarNode(node: DefnVarNode): void {
    if (!this.atTopLevel()) {
      throw new StageError(
        WF_NOT_TOP_LEVEL_DEFN_ERR(Keyword.Define),
        node.sourceSpan
      );
    }
    this.incrementLevel();
    node.value.accept(this);
  }

  visitDefnStructNode(node: DefnStructNode): void {
    if (!this.atTopLevel()) {
      throw new StageError(
        WF_NOT_TOP_LEVEL_DEFN_ERR(Keyword.DefineStruct),
        node.sourceSpan
      );
    }
  }

  visitEllipsisProcAppNode(_: EllipsisProcAppNode): void {
    // skip well-formed check on template
  }

  visitEllipsisNode(_: EllipsisNode): void {
    // skip well-formed check on template
  }

  visitIfNode(node: IfNode): void {
    this.incrementLevel();
    node.question.accept(this);
    node.trueAnswer.accept(this);
    node.falseAnswer.accept(this);
  }

  visitLambdaNode(node: LambdaNode): void {
    this.incrementLevel();
    const scope = this.scope;
    this.scope = new Scope(this.scope);
    node.params.forEach(param => this.scope.set(param, VariableType.Data));
    node.body.accept(this);
    this.scope = scope;
  }

  visitLetNode(node: LetNode): void {
    this.incrementLevel();
    const names: Set<string> = new Set();
    const childScope = new Scope(this.scope);
    const scope = this.scope;
    switch (node.name) {
      case "letrec": {
        node.bindings.forEach(([variable, _]) => {
          if (names.has(variable.name)) {
            throw new StageError(
              LT_ALREADY_DEFINED_LOCALLY_ERR(variable.name),
              variable.sourceSpan
            );
          }
          names.add(variable.name);
          childScope.set(variable.name, VariableType.Data);
        });
        this.scope = childScope;
        node.bindings.forEach(([_, expr]) => expr.accept(this));
        break;
      }
      case "let*": {
        this.scope = childScope;
        node.bindings.forEach(([variable, expr]) => {
          if (names.has(variable.name)) {
            throw new StageError(
              LT_ALREADY_DEFINED_LOCALLY_ERR(variable.name),
              variable.sourceSpan
            );
          }
          names.add(variable.name);
          childScope.set(variable.name, VariableType.Data);
          expr.accept(this);
        });
        break;
      }
      case "let": {
        node.bindings.forEach(([variable, _]) => {
          if (names.has(variable.name)) {
            throw new StageError(
              LT_ALREADY_DEFINED_LOCALLY_ERR(variable.name),
              variable.sourceSpan
            );
          }
          names.add(variable.name);
          childScope.set(variable.name, VariableType.Data);
        });
        node.bindings.forEach(([_, expr]) => expr.accept(this));
        this.scope = childScope;
        break;
      }
      default: {
        throw "illegal state: unsupported let-style expression";
      }
    }
    node.body.accept(this);
    this.scope = scope;
  }

  visitLocalNode(node: LocalNode): void {
    const names: Set<string> = new Set();
    const childScope = new Scope(this.scope);
    node.defns.forEach(defn => {
      if (names.has(defn.name)) {
        throw new StageError(
          LT_ALREADY_DEFINED_LOCALLY_ERR(defn.name),
          defn.nameSourceSpan
        );
      }
      names.add(defn.name);
      defn.addToScope(childScope, true);
    });
    const scope = this.scope;
    this.scope = childScope;
    node.defns.forEach(defn => {
      this.resetLevel();
      defn.accept(this);
    });
    this.incrementLevel();
    node.body.accept(this);
    this.scope = scope;
  }

  visitOrNode(node: OrNode): void {
    this.incrementLevel();
    node.args.forEach(arg => arg.accept(this));
  }

  visitProcAppNode(node: ProcAppNode): void {
    this.incrementLevel();
    node.fn.accept(this);
    node.args.forEach(arg => arg.accept(this));
  }

  visitRequireNode(node: RequireNode): void {
    if (!this.atTopLevel()) {
      throw new StageError(
        RQ_NOT_TOP_LEVEL_ERR,
        node.sourceSpan
      );
    }
  }

  visitVarNode(node: VarNode): void {
    const variableType = this.scope.get(node.name, true, node.sourceSpan);
    if (
      !SETTINGS.higherOrderFunctions
      && variableType === VariableType.StructureType
    ) {
      throw new StageError(
        WF_STRUCTURE_TYPE_ERR(node.name),
        node.sourceSpan
      );
    }
    if (
      !SETTINGS.higherOrderFunctions
      && variableType !== VariableType.Data
    ) {
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
    program.nodes.forEach(node => {
      this.resetLevel();
      node.accept(this);
    });
  }

  private addDefinitionsToScope(defns: (DefnNode | RequireNode)[]) {
    for (const defn of defns) {
      defn.addToScope(this.scope);
    }
  }

  private resetLevel(): void {
    this.level = 0;
  }

  private incrementLevel(): void {
    this.level++;
  }

  private atTopLevel(): boolean {
    return this.level === 0;
  }
}
