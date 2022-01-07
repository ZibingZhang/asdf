import {
  AndNode,
  ASTNode,
  AtomNode,
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
  Stage,
  StageError,
  StageOutput
} from "./pipeline.js";
import {
  DProgram,
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
  DS_EXTRA_PARTS_ERR
} from "./error.js";
import {
  PRIMITIVE_DATA_NAMES,
  PRIMITIVE_FUNCTION_NAMES
} from "./environment.js";
import {
  SourceSpan
} from "./sourcespan.js";

export {
  WELL_FORMED_SYNTAX_STAGE,
  WELL_FORMED_PROGRAM_STAGE
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
    const nodes: ASTNode[] = [];
    for (const sexpr of sexprs) {
      nodes.push(this.toNode(sexpr));
    }
    return new Program(nodes);
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
            new RNumber(BigInt(parseInt(sexpr.token.text)), 1n),
            sexpr.sourceSpan
          );
        }
        case TokenType.RATIONAL: {
          const parts = sexpr.token.text.split("/");
          return new AtomNode(
            new RNumber(BigInt(parseInt(parts[0])), BigInt(parseInt(parts[1]))),
            sexpr.sourceSpan
          );
        }
        case TokenType.DECIMAL: {
          const parts = sexpr.token.text.split(".");
          const scalar = 10n ** BigInt(parts[1].length);
          return new AtomNode(
            new RNumber(BigInt(parseInt(parts[0])) * scalar + BigInt(parseInt(parts[1])), scalar),
            sexpr.sourceSpan
          );
        }
        case TokenType.STRING: {
          return new AtomNode(
            new RString(sexpr.token.text),
            sexpr.sourceSpan
          );
        }
        case TokenType.NAME: {
          return new VarNode(sexpr);
        }
        case TokenType.KEYWORD: {
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
      const leadingSExpr = sexpr.tokens[0];
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
            return this.toQuoteNode(sexpr, sexpr.tokens[1]);
          } else {
            return new FunAppNode(
              new VarNode(leadingSExpr),
              sexpr.tokens.slice(1).map(token => this.toNode(token)),
              sexpr.sourceSpan
            );
          }
        } else if (leadingSExpr.token.type === TokenType.KEYWORD) {
          switch (leadingSExpr.token.text) {
            case "and": {
              if (sexpr.tokens.length - 1 < 2) {
                throw new StageError(
                  FA_MIN_ARITY_ERR("and", 2, sexpr.tokens.length - 1),
                  leadingSExpr.sourceSpan
                );
              }
              return new AndNode(
                sexpr.tokens.slice(1).map(token => this.toNode(token)),
                sexpr.sourceSpan
              );
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
            case "if": {
              if (sexpr.tokens.length - 1 !== 3) {
                throw new StageError(
                  IF_EXPECTED_THREE_PARTS_ERR(sexpr.tokens.length - 1),
                  sexpr.sourceSpan
                );
              }
              return new IfNode(
                this.toNode(sexpr.tokens[1]),
                this.toNode(sexpr.tokens[2]),
                this.toNode(sexpr.tokens[3]),
                sexpr.sourceSpan
              );
            }
            case "or": {
              if (sexpr.tokens.length - 1 < 2) {
                throw new StageError(
                  FA_MIN_ARITY_ERR("or", 2, sexpr.tokens.length - 1),
                  leadingSExpr.sourceSpan
                );
              }
              return new OrNode(
                sexpr.tokens.slice(1).map(token => this.toNode(token)),
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

  private toDefnNode(sexpr: ListSExpr): DefnNode {
    if (sexpr.tokens.length - 1 === 0) {
      throw new StageError(
        DF_EXPECTED_VAR_OR_FUN_NAME_ERR(),
        sexpr.sourceSpan
      );
    }
    let name = sexpr.tokens[1];
    if (isAtomSExpr(name)) {
      if (name.token.type !== TokenType.NAME) {
        throw new StageError(
          DF_EXPECTED_VAR_OR_FUN_NAME_ERR(name),
          name.sourceSpan
        );
      }
      if (sexpr.tokens.length - 1 === 1) {
        throw new StageError(
          DF_EXPECTED_EXPR_ERR(name.token.text),
          sexpr.sourceSpan
        );
      }
      if (sexpr.tokens.length - 1 > 2) {
        throw new StageError(
          DF_TOO_MANY_EXPRS_ERR(name.token.text, sexpr.tokens.length - 3),
          sexpr.tokens[3].sourceSpan
        );
      }
      return new DefnVarNode(
        name.token.text,
        name.sourceSpan,
        this.toNode(sexpr.tokens[2]),
        sexpr.sourceSpan
      );
    } else {
      const nameAndArgs = name;
      if (nameAndArgs.tokens.length === 0) {
        throw new StageError(
          DF_EXPECTED_FUNCTION_NAME_ERR(),
          sexpr.sourceSpan
        );
      }
      name = nameAndArgs.tokens[0];
      if (!isAtomSExpr(name) || name.token.type !== TokenType.NAME) {
        throw new StageError(
          DF_EXPECTED_FUNCTION_NAME_ERR(name),
          sexpr.sourceSpan
        );
      }
      if (nameAndArgs.tokens.length - 1 === 0) {
        throw new StageError(
          DF_EXPECTED_AT_LEAST_ONE_PARAM_ERR,
          nameAndArgs.sourceSpan
        );
      }
      const params: string[] = [];
      for (const arg of nameAndArgs.tokens.slice(1)) {
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
      if (sexpr.tokens.length - 1 === 1) {
        throw new StageError(
          DF_EXPECTED_FUNCTION_BODY_ERR,
          sexpr.sourceSpan
        );
      }
      if (sexpr.tokens.length - 1 > 2) {
        throw new StageError(
          DF_TOO_MANY_FUNCTION_BODIES_ERR(sexpr.tokens.length - 3),
          sexpr.tokens[3].sourceSpan
        );
      }
      return new DefnVarNode(
        name.token.text,
        name.sourceSpan,
        new LambdaNode(
          params,
          this.toNode(sexpr.tokens[2]),
          sexpr.tokens[2].sourceSpan
        ),
        sexpr.sourceSpan
      );
    }
  }

  private toDefnStructNode(sexpr: ListSExpr): DefnStructNode {
    if (sexpr.tokens.length - 1 === 0) {
      throw new StageError(
        DS_EXPECTED_STRUCT_NAME_ERR(),
        sexpr.sourceSpan
      );
    }
    const name = sexpr.tokens[1];
    if (!isAtomSExpr(name) || name.token.type !== TokenType.NAME) {
      throw new StageError(
        DS_EXPECTED_STRUCT_NAME_ERR(name),
        name.sourceSpan
      );
    }
    if (sexpr.tokens.length - 1 === 1) {
      throw new StageError(
        DS_EXPECTED_FIELD_NAMES_ERR(),
        sexpr.sourceSpan
      );
    }
    const fieldNamesSExpr = sexpr.tokens[2];
    if (!isListSExpr(fieldNamesSExpr)) {
      throw new StageError(
        DS_EXPECTED_FIELD_NAMES_ERR(fieldNamesSExpr),
        fieldNamesSExpr.sourceSpan
      );
    }
    const fieldNames: string[] = [];
    for (const fieldNameSExpr of fieldNamesSExpr.tokens) {
      if (!isAtomSExpr(fieldNameSExpr) || fieldNameSExpr.token.type !== TokenType.NAME) {
        throw new StageError(
          DS_EXPECTED_FIELD_NAME_ERR(fieldNameSExpr),
          fieldNameSExpr.sourceSpan
        );
      }
      fieldNames.push(fieldNameSExpr.token.text);
    }
    if (sexpr.tokens.length - 1 > 2) {
      throw new StageError(
        DS_EXTRA_PARTS_ERR(sexpr.tokens.length - 3),
        sexpr.tokens[3].sourceSpan
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
      if (quotedSexpr.tokens.length > 0) {
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

class WellFormedProgram implements Stage<DProgram, DProgram> {
  globalScope: Scope = new Scope(PRIMITIVE_SCOPE);
  executionScope: Scope = new Scope(PRIMITIVE_SCOPE);

  reset() {
    this.globalScope = new Scope(PRIMITIVE_SCOPE);
    this.executionScope = new Scope(PRIMITIVE_SCOPE);
  }

  run(input: StageOutput<DProgram>): StageOutput<DProgram> {
    try {
      this.wellFormedProgram(input.output);
      return input;
    } catch (e) {
      if (e instanceof StageError) {
        return new StageOutput(<DProgram><unknown>null, [e]);
      } else {
        throw e;
      }
    }
  }

  private wellFormedProgram(program: DProgram) {
    for (const defn of program.defns) {
      if (defn.value instanceof LambdaNode) {
        this.globalScope.add(
          defn.name,
          new VariableMeta(
            VariableType.USER_DEFINED_FUNCTION,
            defn.value.params.length
          )
        );
      } else {
        this.globalScope.add(defn.name, DATA_VARIABLE_META);
      }
    }
    for (const node of program.nodes) {
      this.wellFormedNode(node, false);
    }
  }

  private wellFormedNode(node: ASTNode, deferFunApp: boolean) {
    if (node instanceof AndNode) {
      node.args.forEach(arg => this.wellFormedNode(arg, deferFunApp));
    } else if (node instanceof DefnVarNode) {
      if (this.executionScopeHas(node.name)) {
        throw new StageError(
          DF_PREVIOUSLY_DEFINED_NAME_ERR(node.name),
          node.nameSourceSpan
        );
      }
      if (node.value instanceof LambdaNode) {
        this.executionScope.add(
          node.name,
          new VariableMeta(
            VariableType.USER_DEFINED_FUNCTION,
            node.value.params.length
          )
        );
      } else {
        this.executionScope.add(node.name, DATA_VARIABLE_META);
      }
      this.wellFormedNode(node.value, true);
    } else if (node instanceof FunAppNode) {
      let meta: VariableMeta;
      if (deferFunApp) {
        meta = this.globalScope.get(node.fn.name.token.text, false, node.fn.sourceSpan);
      } else {
        meta = this.executionScope.get(node.fn.name.token.text, false, node.fn.sourceSpan);
      }
      if (meta.type === VariableType.USER_DEFINED_FUNCTION && meta.arity != node.args.length) {
        throw new StageError(
          FA_ARITY_ERR(node.fn.name.token.text, meta.arity, node.args.length),
          node.sourceSpan
        );
      }
      node.args.forEach(arg => this.wellFormedNode(arg, deferFunApp));
    } else if (node instanceof IfNode) {
      this.wellFormedNode(node.question, deferFunApp);
      this.wellFormedNode(node.trueAnswer, deferFunApp);
      this.wellFormedNode(node.falseAnswer, deferFunApp);
    } else if (node instanceof LambdaNode) {
      const outerScope = this.executionScope;
      this.executionScope = new Scope(this.executionScope);
      node.params.forEach(param => this.executionScope.add(param, DATA_VARIABLE_META));
      this.wellFormedNode(node.body, deferFunApp);
      this.executionScope = outerScope;
    } else if (node instanceof OrNode) {
      node.args.forEach(arg => this.wellFormedNode(arg, deferFunApp));
    } else if (node instanceof VarNode) {
      const meta = this.executionScope.get(node.name.token.text, true, node.sourceSpan);
      if (meta.type !== VariableType.DATA) {
        throw new StageError(
          WF_EXPECTED_OPEN_PARENTHESIS_ERR(node.name.token.text),
          node.sourceSpan
        );
      }
      if (!this.scopeHas(node.name.token.text)) {
        throw new StageError(
          SC_UNDEFINED_VARIABLE_ERR(node.name.token.text),
          node.sourceSpan
        );
      }
    }
  }

  private scopeHas(name: string): boolean {
    return this.globalScope.has(name) || this.executionScope.has(name);
  }

  private executionScopeHas(name: string): boolean {
    return this.executionScope.has(name);
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
  DATA,
  PRIMITIVE_FUNCTION,
  USER_DEFINED_FUNCTION
}

class VariableMeta {
  constructor(
    readonly type: VariableType,
    readonly arity: number = -1
  ) {}
}

const DATA_VARIABLE_META = new VariableMeta(VariableType.DATA);
const PRIMITIVE_FUNCTION_VARIABLE_META = new VariableMeta(VariableType.DATA);

const PRIMITIVE_SCOPE = new Scope();
for (const name of PRIMITIVE_DATA_NAMES) {
  PRIMITIVE_SCOPE.add(name, DATA_VARIABLE_META);
}
for (const name of PRIMITIVE_FUNCTION_NAMES) {
  PRIMITIVE_SCOPE.add(name, PRIMITIVE_FUNCTION_VARIABLE_META);
}

const WELL_FORMED_SYNTAX_STAGE = new WellFormedSyntax();
const WELL_FORMED_PROGRAM_STAGE = new WellFormedProgram();
