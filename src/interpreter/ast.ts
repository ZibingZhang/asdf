import { BASE_ENVIRONMENT, Environment } from "./environment.js";
import { RVal } from "./value.js";

export {
  ASTNode,
  AtomNode,
  FunAppNode
};

interface ASTNode {
  eval(env: Environment): RVal;
}

class AtomNode implements ASTNode {
  constructor(readonly rval: RVal) {}

  eval(_: Environment) {
    return this.rval;
  }
}

class FunAppNode implements ASTNode {
  constructor(
    readonly name: string,
    readonly args: ASTNode[]
  ) {}

  eval(env: Environment) {
    return env.get(this.name);
  }
}
