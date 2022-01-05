import {
  AndNode,
  ASTNode,
  AtomNode,
  DefnNode,
  EllipsisFunAppNode,
  EllipsisNode,
  ExprNode,
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
  ListSExpr,
  SExpr
} from "./sexpr.js";
import {
  TokenType,
  tokenTypeName
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
  DF_FIRST_ARG_ERR,
  DF_NO_SECOND_ARG_ERR,
  DF_PREVIOUSLY_DEFINED_NAME,
  DF_TOO_MANY_ARGS_ERR,
  EL_EXPECT_FINISHED_EXPR_ERR,
  FA_MIN_ARITY_ERR,
  FC_EXPECTED_FUNCTION_ERR,
  IF_EXPECTED_THREE_PARTS,
  QU_EXPECTED_POST_QUOTE_ERR,
  SC_UNDEFINED_FUNCTION_ERR,
  SC_UNDEFINED_VARIABLE_ERR,
  SX_EXPECTED_OPEN_PAREN_ERR,
  SX_NOT_TOP_LEVEL_DEFN_ERR
} from "./error.js";
import {
  PRIMITIVE_ENVIRONMENT
} from "./environment.js";

export {
  WellFormedSyntax,
  WellFormedProgram
};

class WellFormedSyntax implements Stage {
  level = 0;

  run(input: StageOutput): StageOutput {
    this.level = 0;
    try {
      return new StageOutput(this.processSExprs(input.output));
    } catch (e) {
      if (e instanceof StageError) {
        return new StageOutput(null, [e]);
      } else {
        throw e;
      }
    }
  }

  private processSExprs(sexprs: SExpr[]): Program {
    const nodes: ASTNode[] = [];
    const defns: DefnNode[] = [];
    const exprs: ExprNode[] = [];
    for (const sexpr of sexprs) {
      const node = this.toNode(sexpr);
      nodes.push(this.toNode(sexpr));
      if (isDefnNode(node)) {
        defns.push(node);
      } else {
        exprs.push(node);
      }
    }
    return new Program(defns, exprs, nodes);
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
                  SX_NOT_TOP_LEVEL_DEFN_ERR,
                  sexpr.sourceSpan
                );
              }
              return this.toDefnNode(sexpr);
            }
            case "if": {
              if (sexpr.tokens.length - 1 !== 3) {
                throw new StageError(
                  IF_EXPECTED_THREE_PARTS(sexpr.tokens.length - 1),
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
            FC_EXPECTED_FUNCTION_ERR(tokenTypeName(leadingSExpr.token.type)),
            leadingSExpr.sourceSpan
          );
        }
      } else {
        throw new StageError(
          FC_EXPECTED_FUNCTION_ERR("part"),
          leadingSExpr.sourceSpan
        );
      }
    }
  }

  private toDefnNode(sexpr: ListSExpr): DefnNode {
    if (sexpr.tokens.length === 1) {
      throw new StageError(
        DF_FIRST_ARG_ERR(),
        sexpr.sourceSpan
      );
    }
    let name = sexpr.tokens[1];
    if (isAtomSExpr(name)) {
      if (name.token.type !== TokenType.NAME) {
        throw new StageError(
          DF_FIRST_ARG_ERR(tokenTypeName(name.token.type)),
          name.sourceSpan
        );
      }
      if (sexpr.tokens.length === 2) {
        throw new StageError(
          DF_NO_SECOND_ARG_ERR(name.token.text),
          sexpr.sourceSpan
        );
      }
      if (sexpr.tokens.length > 3) {
        throw new StageError(
          DF_TOO_MANY_ARGS_ERR(name.token.text, sexpr.tokens.length - 3),
          sexpr.tokens[3].sourceSpan
        );
      }
      return new DefnNode(
        name,
        this.toNode(sexpr.tokens[2]),
        sexpr.sourceSpan
      );
    } else {
      const nameAndArgs = name;
      name = nameAndArgs.tokens[0];
      if (isAtomSExpr(name)) {
        return new DefnNode(
          name,
          new LambdaNode(
            nameAndArgs.tokens.slice(1).map(arg => isAtomSExpr(arg) ? arg.token.text : ""),
            this.toNode(sexpr.tokens[2]),
            sexpr.sourceSpan
          ),
          sexpr.sourceSpan
        )
      }
      throw "err";
    }
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
          QU_EXPECTED_POST_QUOTE_ERR(tokenTypeName(quotedSexpr.token.type)),
          sexpr.sourceSpan
        );
      }
    } else {
      if (quotedSexpr.tokens.length > 0) {
        throw new StageError(
          QU_EXPECTED_POST_QUOTE_ERR("part"),
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

class Scope {
  names: Set<string> = new Set();

  constructor(readonly parentScope: Scope | false = false) {}

  add(name: string) {
    this.names.add(name);
  }

  has(name: string): boolean {
    return this.names.has(name) || (this.parentScope && this.parentScope.has(name));
  }
}

class WellFormedProgram implements Stage {
  globalScope: Scope = new Scope();
  executionScope: Scope = new Scope();
  allowTemplate = false;

  run(input: StageOutput): StageOutput {
    this.globalScope = new Scope();
    this.executionScope = new Scope();
    for (const name of PRIMITIVE_ENVIRONMENT.names()) {
      this.globalScope.add(name);
    }
    try {
      this.wellFormedProgram(input.output);
      return input;
    } catch (e) {
      if (e instanceof StageError) {
        return new StageOutput(null, [e]);
      } else {
        throw e;
      }
    }
  }

  private wellFormedProgram(program: Program) {
    program.defns.forEach(defn => this.globalScope.add(defn.name.token.text));
    for (const node of program.nodes) {
      this.wellFormedNode(node);
    }
  }

  private wellFormedNode(node: ASTNode) {
    if (node instanceof DefnNode) {
      if (this.executionScopeHas(node.name.token.text)) {
        throw new StageError(
          DF_PREVIOUSLY_DEFINED_NAME(node.name.token.text),
          node.name.sourceSpan
        );
      }
      this.executionScope.add(node.name.token.text);
      this.wellFormedNode(node.value);
    } else if (node instanceof FunAppNode) {
      if (!this.scopeHas(node.fn.name.token.text)) {
        throw new StageError(
          SC_UNDEFINED_FUNCTION_ERR(node.fn.name.token.text),
          node.fn.sourceSpan
        );
      }
      node.args.forEach(arg => this.wellFormedNode(arg));
    } else if (node instanceof VarNode) {
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
