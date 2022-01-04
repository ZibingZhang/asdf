import {
  Environment
} from "./environment.js";
import {
  FC_EXPECTED_FUNCTION_ERR
} from "./error.js";
import {
  StageError
} from "./pipeline.js";
import {
  isRCallable,
  RVal
} from "./rvalue.js";
import {
  NO_SOURCE_SPAN
} from "./sourcespan.js";

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

  eval(env: Environment): RVal {
    const rval = env.get(this.name);
    if (isRCallable(rval)) {
      return rval.eval(env, this.args.map(node => node.eval(env)));
    } else {
      throw new StageError(FC_EXPECTED_FUNCTION_ERR("variable"), NO_SOURCE_SPAN);
    }
  }
}
