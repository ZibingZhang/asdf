import {
  ASTNode,
  DefnNode,
  ExprNode
} from "./ast";

export {
  Program
};

class Program {
  constructor(
    readonly defns: DefnNode[],
    readonly exprs: ASTNode[]
  ) {}
}
