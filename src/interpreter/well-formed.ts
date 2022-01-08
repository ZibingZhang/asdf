import {
  AndNode,
  ASTNode,
  ASTNodeVisitor,
  AtomNode,
  CondNode,
  DefnNode,
  DefnStructNode,
  DefnVarNode,
  EllipsisFunAppNode,
  EllipsisNode,
  FunAppNode,
  IfNode,
  isDefnNode,
  LambdaNode,
  OrNode,
  VarNode
} from "./ast.js";
import {
  Stage,
  StageError,
  StageOutput
} from "./pipeline.js";
import {
  Program
} from "./program.js";
import {
  isAtomSExpr,
  isListSExpr,
  ListSExpr,
  SExpr
} from "./sexpr.js";
import {
  TokenType
} from "./token.js";
import {
  RExactReal,
  RNumber,
  RString,
  RSymbol,
  R_EMPTY_LIST,
  R_FALSE,
  R_TRUE
} from "./rvalue.js";
import {
  DF_DUPLICATE_VARIABLE_ERR,
  DF_EXPECTED_AT_LEAST_ONE_PARAM_ERR,
  DF_EXPECTED_EXPR_ERR,
  DF_EXPECTED_FUNCTION_BODY_ERR,
  DF_EXPECTED_FUNCTION_NAME_ERR,
  DF_EXPECTED_VAR_OR_FUN_NAME_ERR,
  DF_EXPECTED_VARIABLE_ERR,
  DF_PREVIOUSLY_DEFINED_NAME_ERR,
  DF_TOO_MANY_EXPRS_ERR,
  DF_TOO_MANY_FUNCTION_BODIES_ERR,
  FA_ARITY_ERR,
  FA_MIN_ARITY_ERR,
  FC_EXPECTED_FUNCTION_ERR,
  IF_EXPECTED_THREE_PARTS_ERR,
  QU_EXPECTED_POST_QUOTE_ERR,
  SC_UNDEFINED_FUNCTION_ERR,
  SC_UNDEFINED_VARIABLE_ERR,
  SX_EXPECTED_OPEN_PAREN_ERR,
  SX_NOT_TOP_LEVEL_DEFN_ERR,
  WF_EXPECTED_OPEN_PARENTHESIS_ERR,
  DS_EXPECTED_STRUCT_NAME_ERR,
  DS_EXPECTED_FIELD_NAMES_ERR,
  DS_EXPECTED_FIELD_NAME_ERR,
  DS_EXTRA_PARTS_ERR,
  WF_STRUCTURE_TYPE_ERR,
  ES_NOT_IN_COND_ERR,
  CN_EXPECTED_TWO_PART_CLAUSE_ERR,
  CN_ELSE_NOT_LAST_CLAUSE_ERR
} from "./error.js";
import {
  PRIMITIVE_DATA_NAMES,
  PRIMITIVE_FUNCTION_NAMES
} from "./environment.js";
import {
  SourceSpan
} from "./sourcespan.js";

export {
  WellFormedSyntax,
  WellFormedProgram
};

class WellFormedSyntax implements Stage<SExpr[], Program> {
  level = 0;

  run(input: StageOutput<SExpr[]>): StageOutput<Program> {
    this.level = 0;
    try {
      return new StageOutput(this.processSExprs(input.output));
    } catch (e) {
      if (e instanceof StageError) {
        return new StageOutput(<Program><unknown>null, [e]);
      } else {
        throw e;
      }
    }
  }

  private processSExprs(sexprs: SExpr[]): Program {
    const defns: DefnNode[] = [];
    const nodes: ASTNode[] = [];
    for (const sexpr of sexprs) {
      const node = this.toNode(sexpr);
      if (isDefnNode(node)) { defns.push(node); }
      nodes.push(node);
    }
    return new Program(defns, nodes);
  }

  private toNode(sexpr: SExpr): ASTNode {
    this.level++;
    const node = this.toNodeHelper(sexpr);
    this.level--;
    return node;
  }

  private toNodeHelper(sexpr: SExpr): ASTNode {
    if (isAtomSExpr(sexpr)) {
      switch (sexpr.token.type) {
        case TokenType.TRUE: {
          return new AtomNode(
            R_TRUE,
            sexpr.sourceSpan
          );
        }
        case TokenType.FALSE: {
          return new AtomNode(
            R_FALSE,
            sexpr.sourceSpan
          );
        }
        case TokenType.INTEGER: {
          return new AtomNode(
            new RExactReal(BigInt(sexpr.token.text), 1n),
            sexpr.sourceSpan
          );
        }
        case TokenType.RATIONAL: {
          const parts = sexpr.token.text.split("/");
          return new AtomNode(
            new RExactReal(BigInt(parts[0]), BigInt(parts[1])),
            sexpr.sourceSpan
          );
        }
        case TokenType.DECIMAL: {
          const parts = sexpr.token.text.split(".");
          const scalar = 10n ** BigInt(parts[1].length);
          return new AtomNode(
            new RExactReal(BigInt(parts[0]) * scalar + BigInt(parts[1]), scalar),
            sexpr.sourceSpan
          );
        }
        case TokenType.STRING: {
          return new AtomNode(
            new RString(sexpr.token.text.slice(1, -1)),
            sexpr.sourceSpan
          );
        }
        case TokenType.NAME: {
          return new VarNode(sexpr.token.text, sexpr.sourceSpan);
        }
        case TokenType.KEYWORD: {
          if (sexpr.token.text === "else") {
            throw new StageError(
              ES_NOT_IN_COND_ERR,
              sexpr.sourceSpan
            );
          }
          throw new StageError(
            SX_EXPECTED_OPEN_PAREN_ERR(sexpr.token.text),
            sexpr.sourceSpan
          );
        }
        case TokenType.PLACEHOLDER: {
          return new EllipsisNode(sexpr.sourceSpan);
        }
        default:
          throw "something?";
      }
    } else {
      const leadingSExpr = sexpr.subExprs[0];
      if (!leadingSExpr) {
        throw new StageError(
          FC_EXPECTED_FUNCTION_ERR(),
          sexpr.sourceSpan
        );
      } else if (isAtomSExpr(leadingSExpr)) {
        if (leadingSExpr.token.type === TokenType.PLACEHOLDER) {
          return new EllipsisFunAppNode(sexpr.sourceSpan);
        } else if (leadingSExpr.token.type === TokenType.NAME) {
          if (leadingSExpr.token.text === "quote") {
            return this.toQuoteNode(sexpr, sexpr.subExprs[1]);
          } else {
            return new FunAppNode(
              new VarNode(leadingSExpr.token.text, leadingSExpr.sourceSpan),
              sexpr.subExprs.slice(1).map(sexpr => this.toNode(sexpr)),
              sexpr.sourceSpan
            );
          }
        } else if (leadingSExpr.token.type === TokenType.KEYWORD) {
          switch (leadingSExpr.token.text) {
            case "and": {
              if (sexpr.subExprs.length - 1 < 2) {
                throw new StageError(
                  FA_MIN_ARITY_ERR("and", 2, sexpr.subExprs.length - 1),
                  leadingSExpr.sourceSpan
                );
              }
              return new AndNode(
                sexpr.subExprs.slice(1).map(sexpr => this.toNode(sexpr)),
                sexpr.sourceSpan
              );
            }
            case "cond": {
              return this.toCondNode(sexpr);
            }
            case "define": {
              if (!this.atTopLevel()) {
                throw new StageError(
                  SX_NOT_TOP_LEVEL_DEFN_ERR("define"),
                  sexpr.sourceSpan
                );
              }
              return this.toDefnNode(sexpr);
            }
            case "define-struct": {
              if (!this.atTopLevel()) {
                throw new StageError(
                  SX_NOT_TOP_LEVEL_DEFN_ERR("define-struct"),
                  sexpr.sourceSpan
                );
              }
              return this.toDefnStructNode(sexpr);
            }
            case "else": {
              throw new StageError(
                ES_NOT_IN_COND_ERR,
                leadingSExpr.sourceSpan
              )
            }
            case "if": {
              if (sexpr.subExprs.length - 1 !== 3) {
                throw new StageError(
                  IF_EXPECTED_THREE_PARTS_ERR(sexpr.subExprs.length - 1),
                  sexpr.sourceSpan
                );
              }
              return new IfNode(
                this.toNode(sexpr.subExprs[1]),
                this.toNode(sexpr.subExprs[2]),
                this.toNode(sexpr.subExprs[3]),
                sexpr.sourceSpan
              );
            }
            case "or": {
              if (sexpr.subExprs.length - 1 < 2) {
                throw new StageError(
                  FA_MIN_ARITY_ERR("or", 2, sexpr.subExprs.length - 1),
                  leadingSExpr.sourceSpan
                );
              }
              return new OrNode(
                sexpr.subExprs.slice(1).map(sexpr => this.toNode(sexpr)),
                sexpr.sourceSpan
              );
            }
            default:
              throw "illegal state: non-existent keyword";
          }
        } else {
          throw new StageError(
            FC_EXPECTED_FUNCTION_ERR(leadingSExpr),
            leadingSExpr.sourceSpan
          );
        }
      } else {
        throw new StageError(
          FC_EXPECTED_FUNCTION_ERR(leadingSExpr),
          leadingSExpr.sourceSpan
        );
      }
    }
  }

  private toCondNode(sexpr: ListSExpr): CondNode {
    const questionAnswerClauses: [ASTNode, ASTNode][] = [];
    if (sexpr.subExprs.length - 1 === 0) {
      throw new StageError(
        CN_EXPECTED_TWO_PART_CLAUSE_ERR(),
        sexpr.sourceSpan
      );
    }
    for (const [idx, token] of sexpr.subExprs.slice(1).entries()) {
      if (!isListSExpr(token) || token.subExprs.length !== 2) {
        throw new StageError(
          CN_EXPECTED_TWO_PART_CLAUSE_ERR(token),
          token.sourceSpan
        );
      }
      const questionSExpr = token.subExprs[0];
      if (isAtomSExpr(questionSExpr)
        && questionSExpr.token.type === TokenType.KEYWORD
        && questionSExpr.token.text === "else"
      ) {
        if (idx < sexpr.subExprs.length - 2) {
          throw new StageError(
            CN_ELSE_NOT_LAST_CLAUSE_ERR,
            token.sourceSpan
          )
        }
        questionAnswerClauses.push([new AtomNode(R_TRUE, questionSExpr.sourceSpan), this.toNode(token.subExprs[1])]);
      } else {
        questionAnswerClauses.push([this.toNode(questionSExpr), this.toNode(token.subExprs[1])]);
      }
    }
    return new CondNode(questionAnswerClauses, sexpr.sourceSpan);
  }

  private toDefnNode(sexpr: ListSExpr): DefnNode {
    if (sexpr.subExprs.length - 1 === 0) {
      throw new StageError(
        DF_EXPECTED_VAR_OR_FUN_NAME_ERR(),
        sexpr.sourceSpan
      );
    }
    let name = sexpr.subExprs[1];
    if (isAtomSExpr(name)) {
      if (name.token.type !== TokenType.NAME) {
        throw new StageError(
          DF_EXPECTED_VAR_OR_FUN_NAME_ERR(name),
          name.sourceSpan
        );
      }
      if (sexpr.subExprs.length - 1 === 1) {
        throw new StageError(
          DF_EXPECTED_EXPR_ERR(name.token.text),
          sexpr.sourceSpan
        );
      }
      if (sexpr.subExprs.length - 1 > 2) {
        throw new StageError(
          DF_TOO_MANY_EXPRS_ERR(name.token.text, sexpr.subExprs.length - 3),
          sexpr.subExprs[3].sourceSpan
        );
      }
      return new DefnVarNode(
        name.token.text,
        name.sourceSpan,
        this.toNode(sexpr.subExprs[2]),
        sexpr.sourceSpan
      );
    } else {
      const nameAndArgs = name;
      if (nameAndArgs.subExprs.length === 0) {
        throw new StageError(
          DF_EXPECTED_FUNCTION_NAME_ERR(),
          sexpr.sourceSpan
        );
      }
      name = nameAndArgs.subExprs[0];
      if (!isAtomSExpr(name) || name.token.type !== TokenType.NAME) {
        throw new StageError(
          DF_EXPECTED_FUNCTION_NAME_ERR(name),
          sexpr.sourceSpan
        );
      }
      if (nameAndArgs.subExprs.length - 1 === 0) {
        throw new StageError(
          DF_EXPECTED_AT_LEAST_ONE_PARAM_ERR,
          nameAndArgs.sourceSpan
        );
      }
      const params: string[] = [];
      for (const arg of nameAndArgs.subExprs.slice(1)) {
        if (!isAtomSExpr(arg) || arg.token.type !== TokenType.NAME) {
          throw new StageError(
            DF_EXPECTED_VARIABLE_ERR(arg),
            arg.sourceSpan
          );
        }
        if (params.includes(arg.token.text)) {
          throw new StageError(
            DF_DUPLICATE_VARIABLE_ERR(arg.token.text),
            arg.sourceSpan
          );
        }
        params.push(arg.token.text);
      }
      if (sexpr.subExprs.length - 1 === 1) {
        throw new StageError(
          DF_EXPECTED_FUNCTION_BODY_ERR,
          sexpr.sourceSpan
        );
      }
      if (sexpr.subExprs.length - 1 > 2) {
        throw new StageError(
          DF_TOO_MANY_FUNCTION_BODIES_ERR(sexpr.subExprs.length - 3),
          sexpr.subExprs[3].sourceSpan
        );
      }
      return new DefnVarNode(
        name.token.text,
        name.sourceSpan,
        new LambdaNode(
          params,
          this.toNode(sexpr.subExprs[2]),
          sexpr.subExprs[2].sourceSpan
        ),
        sexpr.sourceSpan
      );
    }
  }

  private toDefnStructNode(sexpr: ListSExpr): DefnStructNode {
    if (sexpr.subExprs.length - 1 === 0) {
      throw new StageError(
        DS_EXPECTED_STRUCT_NAME_ERR(),
        sexpr.sourceSpan
      );
    }
    const name = sexpr.subExprs[1];
    if (!isAtomSExpr(name) || name.token.type !== TokenType.NAME) {
      throw new StageError(
        DS_EXPECTED_STRUCT_NAME_ERR(name),
        name.sourceSpan
      );
    }
    if (sexpr.subExprs.length - 1 === 1) {
      throw new StageError(
        DS_EXPECTED_FIELD_NAMES_ERR(),
        sexpr.sourceSpan
      );
    }
    const fieldNamesSExpr = sexpr.subExprs[2];
    if (!isListSExpr(fieldNamesSExpr)) {
      throw new StageError(
        DS_EXPECTED_FIELD_NAMES_ERR(fieldNamesSExpr),
        fieldNamesSExpr.sourceSpan
      );
    }
    const fieldNames: string[] = [];
    for (const fieldNameSExpr of fieldNamesSExpr.subExprs) {
      if (!isAtomSExpr(fieldNameSExpr) || fieldNameSExpr.token.type !== TokenType.NAME) {
        throw new StageError(
          DS_EXPECTED_FIELD_NAME_ERR(fieldNameSExpr),
          fieldNameSExpr.sourceSpan
        );
      }
      fieldNames.push(fieldNameSExpr.token.text);
    }
    if (sexpr.subExprs.length - 1 > 2) {
      throw new StageError(
        DS_EXTRA_PARTS_ERR(sexpr.subExprs.length - 3),
        sexpr.subExprs[3].sourceSpan
      );
    }
    return new DefnStructNode(
      name.token.text,
      fieldNames,
      sexpr.sourceSpan
    );
  }

  private toQuoteNode(sexpr: SExpr, quotedSexpr: SExpr): AtomNode {
    if (isAtomSExpr(quotedSexpr)) {
      if (quotedSexpr.token.type === TokenType.NAME) {
        return new AtomNode(
          new RSymbol(quotedSexpr.token.text),
          quotedSexpr.sourceSpan
        );
      } else {
        throw new StageError(
          QU_EXPECTED_POST_QUOTE_ERR(sexpr),
          sexpr.sourceSpan
        );
      }
    } else {
      if (quotedSexpr.subExprs.length > 0) {
        throw new StageError(
          QU_EXPECTED_POST_QUOTE_ERR(sexpr),
          sexpr.sourceSpan
        );
      } else {
        return new AtomNode(
          R_EMPTY_LIST,
          sexpr.sourceSpan
        );
      }
    }
  }

  private atTopLevel() {
    return this.level === 1;
  }
}

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
        WF_EXPECTED_OPEN_PARENTHESIS_ERR(node.name),
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
    for (const defn of program.defns) {
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
    for (const node of program.nodes) {
      node.accept(this);
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
    const meta = this.variables.get(name) || (this.parentScope && this.parentScope.get(name, expectData, sourceSpan));
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
    return this.variables.has(name) || (this.parentScope && this.parentScope.has(name));
  }
}

enum VariableType {
  DATA = "DATA",
  PRIMITIVE_FUNCTION = "PRIMITIVE_FUNCTION",
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
