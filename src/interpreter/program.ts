import {
  ASTNode
} from "./ast";

export {
  Program
};

class Program {
  constructor(
    readonly exprs: ASTNode[]
  ) {}
}
