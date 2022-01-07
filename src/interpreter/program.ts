import {
  ASTNode,
  DASTNode,
  DefnVarNode
} from "./ast";

export {
  DProgram,
  Program
};

class Program {
  constructor(
    readonly nodes: ASTNode[]
  ) {}
}

class DProgram {
  constructor(
    readonly defns: DefnVarNode[],
    readonly nodes: DASTNode[]
  ) {}
}
