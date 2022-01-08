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
  VarNode
} from "./ast.js";
import {
  DF_PREVIOUSLY_DEFINED_NAME_ERR,
  FA_ARITY_ERR,
  SC_UNDEFINED_FUNCTION_ERR,
  SC_UNDEFINED_VARIABLE_ERR,
  WF_EXPECTED_OPEN_PAREN_ERR,
  WF_STRUCTURE_TYPE_ERR
} from "./error.js";
import {
  PRIMITIVE_DATA_NAMES,
  PRIMITIVE_FUNCTION_NAMES,
  PRIMITIVE_TEST_FUNCTIONS
} from "./environment.js";
import {
  Stage,
  StageError,
  StageOutput
} from "./pipeline.js";
import {
  Program
} from "./program.js";
import {
  SourceSpan
} from "./sourcespan.js";

export {
  WellFormedProgram
};

class WellFormedProgram implements ASTNodeVisitor<void>, Stage<Program, Program> {
  scope: Scope = new Scope(PRIMITIVE_SCOPE);

  reset() {
    this.scope = new Scope(PRIMITIVE_SCOPE);
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
    if (meta.type === VariableType.USER_DEFINED_FUNCTION && meta.arity != node.args.length) {
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

  visitOrNode(node: OrNode): void {
    node.args.forEach(arg => arg.accept(this));
  }

  visitVarNode(node: VarNode): void {
    const meta = this.scope.get(node.name, true, node.sourceSpan);
    if (meta.type === VariableType.STRUCTURE_TYPE) {
      throw new StageError(
        WF_STRUCTURE_TYPE_ERR(node.name),
        node.sourceSpan
      );
    }
    if (meta.type !== VariableType.DATA) {
      throw new StageError(
        WF_EXPECTED_OPEN_PAREN_ERR(node.name),
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
      if (defn instanceof DefnVarNode) {
        if (defn.value instanceof LambdaNode) {
          if (this.scope.has(defn.name)) {
            throw new StageError(
              DF_PREVIOUSLY_DEFINED_NAME_ERR(defn.name),
              defn.nameSourceSpan
            );
          }
          this.scope.add(
            defn.name,
            new VariableMeta(
              VariableType.USER_DEFINED_FUNCTION,
              defn.value.params.length
            )
          );
        } else {
          if (this.scope.has(defn.name)) {
            throw new StageError(
              DF_PREVIOUSLY_DEFINED_NAME_ERR(defn.name),
              defn.nameSourceSpan
            );
          }
          this.scope.add(defn.name, DATA_VARIABLE_META);
        }
      } else {
        if (this.scope.has(defn.name)) {
          throw new StageError(
            DF_PREVIOUSLY_DEFINED_NAME_ERR(defn.name),
            defn.sourceSpan
          );
        }
        this.scope.add(defn.name, STRUCTURE_TYPE_VARIABLE_META);
        if (this.scope.has(`make-${defn.name}`)) {
          throw new StageError(
            DF_PREVIOUSLY_DEFINED_NAME_ERR(`make-${defn.name}`),
            defn.sourceSpan
          );
        }
        this.scope.add(
          `make-${defn.name}`,
          new VariableMeta(VariableType.USER_DEFINED_FUNCTION, defn.fields.length)
        );
        if (this.scope.has(`${defn.name}?`)) {
          throw new StageError(
            DF_PREVIOUSLY_DEFINED_NAME_ERR(`${defn.name}?`),
            defn.sourceSpan
          );
        }
        this.scope.add(
          `${defn.name}?`,
          new VariableMeta(VariableType.USER_DEFINED_FUNCTION, 1)
        );
        defn.fields.forEach(field => {
          if (this.scope.has(`${defn.name}-${field}`)) {
            throw new StageError(
              DF_PREVIOUSLY_DEFINED_NAME_ERR(`${defn.name}-${field}`),
              defn.sourceSpan
            );
          }
          this.scope.add(
            `${defn.name}-${field}`,
            new VariableMeta(VariableType.USER_DEFINED_FUNCTION, 1)
          );
        });
      }
    }
  }
}

class Scope {
  private variables: Map<string, VariableMeta> = new Map();

  constructor(readonly parentScope: Scope | false = false) {}

  add(name: string, meta: VariableMeta) {
    this.variables.set(name, meta);
  }

  get(name: string, expectData: boolean, sourceSpan: SourceSpan): VariableMeta {
    const meta = this.variables.get(name)
      || (this.parentScope && this.parentScope.get(name, expectData, sourceSpan));
    if (!meta) {
      if (expectData) {
        throw new StageError(
          SC_UNDEFINED_VARIABLE_ERR(name),
          sourceSpan
        );
      } else {
        throw new StageError(
          SC_UNDEFINED_FUNCTION_ERR(name),
          sourceSpan
        );
      }
    }
    return meta;
  }

  has(name: string): boolean {
    return this.variables.has(name)
      || (this.parentScope && this.parentScope.has(name));
  }
}

enum VariableType {
  DATA = "DATA",
  PRIMITIVE_FUNCTION = "PRIMITIVE_FUNCTION",
  PRIMITIVE_TEST_FUNCTION = "PRIMITIVE_TEST_FUNCTION",
  STRUCTURE_TYPE = "STRUCTURE_TYPE",
  USER_DEFINED_FUNCTION = "USER_DEFINED_FUNCTION"
}

class VariableMeta {
  constructor(
    readonly type: VariableType,
    readonly arity: number = -1
  ) {}
}

const DATA_VARIABLE_META = new VariableMeta(VariableType.DATA);
const PRIMITIVE_FUNCTION_VARIABLE_META = new VariableMeta(VariableType.PRIMITIVE_FUNCTION);
const STRUCTURE_TYPE_VARIABLE_META = new VariableMeta(VariableType.STRUCTURE_TYPE);

const PRIMITIVE_SCOPE = new Scope();
PRIMITIVE_DATA_NAMES.forEach((name) => PRIMITIVE_SCOPE.add(name, DATA_VARIABLE_META));
PRIMITIVE_FUNCTION_NAMES.forEach((name) => PRIMITIVE_SCOPE.add(name, PRIMITIVE_FUNCTION_VARIABLE_META));
PRIMITIVE_TEST_FUNCTIONS.forEach((_, name) => PRIMITIVE_SCOPE.add(name, PRIMITIVE_FUNCTION_VARIABLE_META));
