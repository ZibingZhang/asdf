import {
  ASTNode,
  AtomNode,
  FunAppNode
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
  RVariable,
  R_EMPTY_LIST,
  R_FALSE,
  R_TRUE
} from "./rvalue.js";
import {
  FC_EXPECTED_FUNCTION_ERR,
  Q_EXPECTED_POST_QUOTE_ERR
} from "./error.js";

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
        default:
          throw "something?";
      }
    } else {
      const leadingSExpr = sexpr.tokens[0];
      if (!leadingSExpr) {
        throw new StageError(FC_EXPECTED_FUNCTION_ERR(null), sexpr.sourceSpan);
      } else if (isAtomSExpr(leadingSExpr) && leadingSExpr.token.type === TokenType.NAME) {
        if (leadingSExpr.token.text === "quote") {
          return this.toQuoteNode(sexpr, sexpr.tokens[1]);
        } else {
          return new FunAppNode(
            new AtomNode(
              new RVariable(leadingSExpr.token.text),
              leadingSExpr.sourceSpan
            ),
            sexpr.tokens.slice(1).map(token => this.toNode(token)),
            sexpr.sourceSpan
          );
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
          Q_EXPECTED_POST_QUOTE_ERR(tokenTypeName(quotedSexpr.token.type)),
          sexpr.sourceSpan
        );
      }
    } else {
      if (quotedSexpr.tokens.length > 0) {
        console.log(quotedSexpr);
        throw new StageError(
          Q_EXPECTED_POST_QUOTE_ERR("part"),
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

class WellFormedProgram implements Stage {
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

  private runHelper(program: Program): Program {
    return program;
  }
}
