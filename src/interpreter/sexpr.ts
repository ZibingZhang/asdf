import { Token } from "./token.js";

interface SExpr {}

interface AtomSExpr extends SExpr {
  readonly token: Token
}

interface ListSExpr extends SExpr {
  readonly tokens: Token[]
}
