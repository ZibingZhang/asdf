import {
  SourceSpan
} from "./sourcespan.js";
import {
  Token,
  TokenType
} from "./token.js";

export {
  AtomSExpr,
  ListSExpr,
  SExpr,
  isAtomSExpr,
  isListSExpr,
  sexprTypeName
};

type SExpr = AtomSExpr | ListSExpr;

abstract class SExprBase {
  constructor(readonly sourceSpan: SourceSpan) {}

  abstract stringify(): string;
}

class AtomSExpr extends SExprBase {
  constructor(
    readonly token: Token,
    readonly sourceSpan: SourceSpan
  ) {
    super(sourceSpan);
  }

  stringify(): string {
    return this.token.text;
  }
}

class ListSExpr extends SExprBase {
  constructor(
    readonly tokens: SExpr[],
    readonly sourceSpan: SourceSpan
  ) {
    super(sourceSpan);
  }

  stringify(): string {
    return `(${this.tokens.map(token => token.stringify()).join(" ")})`;
  }
}

function isAtomSExpr(sexpr: SExpr): sexpr is AtomSExpr {
  return sexpr instanceof AtomSExpr;
}

function isListSExpr(sexpr: SExpr): sexpr is ListSExpr {
  return sexpr instanceof ListSExpr;
}

function sexprTypeName(sexpr: SExpr): string {
  if (isAtomSExpr(sexpr)) {
    switch (sexpr.token.type) {
      case TokenType.TRUE:
      case TokenType.FALSE:
        return "boolean";
      case TokenType.INTEGER:
      case TokenType.RATIONAL:
      case TokenType.DECIMAL:
        return "number";
      case TokenType.KEYWORD:
        return "keyword";
      case TokenType.PLACEHOLDER:
        return "template";
      default:
        throw "illegal state: unsupported token type";
    }
  } else {
    return "part";
  }
}
