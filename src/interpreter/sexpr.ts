import { SourceSpan } from "./sourcespan.js";
import { Token } from "./token.js";

export {
  AtomSExpr,
  ListSExpr,
  SExpr
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
