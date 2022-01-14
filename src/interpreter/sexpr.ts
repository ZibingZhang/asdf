import {
  SourceSpan
} from "./sourcespan";
import {
  Token
} from "./token";

export {
  AtomSExpr,
  ListSExpr,
  SExpr,
  isAtomSExpr,
  isListSExpr
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
    readonly subSExprs: SExpr[],
    readonly sourceSpan: SourceSpan
  ) {
    super(sourceSpan);
  }

  stringify(): string {
    return `(${this.subSExprs.map(sexpr => sexpr.stringify()).join(" ")})`;
  }
}

function isAtomSExpr(sexpr: SExpr): sexpr is AtomSExpr {
  return sexpr instanceof AtomSExpr;
}

function isListSExpr(sexpr: SExpr): sexpr is ListSExpr {
  return sexpr instanceof ListSExpr;
}
