import {
  SourceSpan
} from "../data/sourcespan";
import {
  Token
} from "./token";

export {
  SExpr,
  AtomSExpr,
  ListSExpr,
  makeAtomSExpr,
  makeListSExpr,
  isAtomSExpr,
  isListSExpr
};

type SExpr =
  | AtomSExpr
  | ListSExpr;

type AtomSExpr = {
  readonly token: Token;
  readonly sourceSpan: SourceSpan;
}

type ListSExpr = {
  readonly subSExprs: SExpr[];
  readonly sourceSpan: SourceSpan;
}

function makeAtomSExpr(
  token: Token,
  sourceSpan: SourceSpan
): AtomSExpr {
  return {
    token,
    sourceSpan
  };
}

function makeListSExpr(
  subSExprs: SExpr[],
  sourceSpan: SourceSpan
): ListSExpr {
  return {
    subSExprs,
    sourceSpan
  };
}

function isAtomSExpr(sexpr: SExpr): sexpr is AtomSExpr {
  return "token" in sexpr;
}

function isListSExpr(sexpr: SExpr): sexpr is ListSExpr {
  return "subSExprs" in sexpr;
}
