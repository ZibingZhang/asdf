import {
  ASTNode,
  DASTNode,
  DefnNode,
  ExprNode
} from "./ast";

export {
  DProgram,
  Program
};

class Program {
  constructor(
    readonly defns: DefnNode[],
    readonly nodes: ASTNode[]
  ) {}
}

class DProgram {
  constructor(
    readonly defns: DefnNode[],
    readonly nodes: DASTNode[]
  ) {}
}
