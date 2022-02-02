import {
  ASTNode,
  DefnNode,
  RequireNode
} from "./ast";

export {
  Program
};

class Program {
  constructor(
    readonly defns: (DefnNode | RequireNode)[],
    readonly nodes: ASTNode[]
  ) {}
}
