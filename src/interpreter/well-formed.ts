import {
  AndNode,
  ASTNode,
  AtomNode,
  FunAppNode,
  OrNode,
  VariableNode
} from "./ast.js";
import {
  prettyPrint
} from "./dev-utils.js";
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
  FA_MIN_ARITY_ERR,
  FC_EXPECTED_FUNCTION_ERR,
  QU_EXPECTED_POST_QUOTE_ERR,
  SC_UNDEFINED_VARIABLE
} from "./error.js";
import { PRIMITIVE_ENVIRONMENT } from "./environment.js";

export {
  WellFormedSyntax,
  WellFormedProgram
};

class WellFormedSyntax implements Stage {
  run(input: StageOutput): StageOutput {
    try {
      return new StageOutput(this.runHelper(input.output));
    } catch (e) {
      if (e instanceof StageError) {
        return new StageOutput(null, [e]);
      } else {
        throw e;
      }
    }
  }

  private runHelper(sexprs: SExpr[]): Program {
    const asts: ASTNode[] = [];
    for (const sexpr of sexprs) {
      asts.push(this.toNode(sexpr));
    }

    for (const ast of asts) {
      prettyPrint(ast);
    }

    return new Program(asts);
  }

  private toNode(sexpr: SExpr): ASTNode {
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
          return new VariableNode(sexpr);
        }
        default:
          throw "something?";
      }
    } else {
      const leadingSExpr = sexpr.tokens[0];
      if (!leadingSExpr) {
        throw new StageError(FC_EXPECTED_FUNCTION_ERR(null), sexpr.sourceSpan);
      } else if (isAtomSExpr(leadingSExpr) && leadingSExpr.token.type === TokenType.NAME) {
        switch (leadingSExpr.token.text) {
          case "quote": {
            return this.toQuoteNode(sexpr, sexpr.tokens[1]);
          }
          case "and": {
            if (sexpr.tokens.length - 1 < 2) {
              throw new StageError(
                FA_MIN_ARITY_ERR("and", 2, sexpr.tokens.length - 1),
                leadingSExpr.sourceSpan
              );
            }
            return new AndNode(
              leadingSExpr.sourceSpan,
              sexpr.tokens.slice(1).map(token => this.toNode(token)),
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
              leadingSExpr.sourceSpan,
              sexpr.tokens.slice(1).map(token => this.toNode(token)),
              sexpr.sourceSpan
            );
          }
          default: {
            return new FunAppNode(
              new VariableNode(leadingSExpr),
              sexpr.tokens.slice(1).map(token => this.toNode(token)),
              sexpr.sourceSpan
            );
          }
        }
      } else if (isAtomSExpr(leadingSExpr)) {
        throw new StageError(
          FC_EXPECTED_FUNCTION_ERR(tokenTypeName(leadingSExpr.token.type)),
          sexpr.sourceSpan)
        ;
      } else {
        throw new StageError(
          FC_EXPECTED_FUNCTION_ERR("part"),
          sexpr.sourceSpan
        );
      }
    }
  }

  private toQuoteNode(sexpr: SExpr, quotedSexpr: SExpr): ASTNode {
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
}

class Scope {
  names: Set<string> = new Set();

  constructor(readonly parentScope: Scope | false = false) {}

  add(name: string) {
    this.names.add(name);
  }

  contains(name: string): boolean {
    return this.names.has(name) || (this.parentScope && this.parentScope.contains(name));
  }
}

class WellFormedProgram implements Stage {
  scope: Scope = new Scope();

  run(input: StageOutput): StageOutput {
    for (const name of PRIMITIVE_ENVIRONMENT.names()) {
      this.scope.add(name);
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
    for (const expr of program.exprs) {
      this.wellFormedNode(expr);
    }
  }

  private wellFormedNode(expr: ASTNode) {
    if (expr instanceof VariableNode) {
      if (!this.scope.contains(expr.name.token.text)) {
        throw new StageError(SC_UNDEFINED_VARIABLE(expr.name.token.text), expr.sourceSpan);
      }
    } else if (expr instanceof FunAppNode) {
      if (!this.scope.contains(expr.fn.name.token.text)) {
        throw new StageError(SC_UNDEFINED_VARIABLE(expr.fn.name.token.text), expr.fn.sourceSpan);
      }
      expr.args.forEach(arg => this.wellFormedNode(arg));
    }
  }
}
