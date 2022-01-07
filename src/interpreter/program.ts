import {
  ASTNode,
  DefnNode
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
    readonly defns: DefnNode[],
    readonly nodes: ASTNode[]
  ) {}
}
