import {
  ASTNode,
  DefnNode
} from "./ast";

export {
  Program
};

class Program {
  constructor(
    readonly defns: DefnNode[],
    readonly nodes: ASTNode[]
  ) {}
}
