import { SourceSpan } from "./sourcespan.js";
import { Token } from "./token.js";

export {
  AtomSExpr,
  ListSExpr,
  SExpr,
  isAtomSExpr,
  isListSExpr
};

class SExpr {
  constructor(readonly sourceSpan: SourceSpan) {}
}

class AtomSExpr extends SExpr {
  constructor(
    readonly token: Token,
    readonly sourceSpan: SourceSpan
  ) {
    super(sourceSpan);
  }
}

class ListSExpr extends SExpr {
  constructor(
    readonly tokens: SExpr[],
    readonly sourceSpan: SourceSpan
  ) {
    super(sourceSpan);
  }
}

function isAtomSExpr(sexpr: SExpr): sexpr is AtomSExpr {
  return sexpr instanceof AtomSExpr;
}

function isListSExpr(sexpr: SExpr): sexpr is ListSExpr {
  return sexpr instanceof ListSExpr;
}
