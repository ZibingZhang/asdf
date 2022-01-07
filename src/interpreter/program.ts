import {
  ASTNode,
  DASTNode,
  DefnNode,
  DefnVarNode
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
    readonly defns: DefnVarNode[],
    readonly nodes: DASTNode[]
  ) {}
}
