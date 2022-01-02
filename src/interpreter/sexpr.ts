import { Token } from "./token.js";

export {
  AtomSExpr,
  ListSExpr,
  SExpr
};

interface SExpr {}

class AtomSExpr implements SExpr {
  constructor(readonly token: Token) {}
}

class ListSExpr implements SExpr {
  constructor(readonly tokens: SExpr[]) {}
}
