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
  RValue
} from "./rvalue.js";
import {
  NO_SOURCE_SPAN, SourceSpan
} from "./sourcespan.js";

export {
  ASTNode,
  AtomNode,
  FunAppNode
};

abstract class ASTNode {
  constructor(readonly sourceSpan: SourceSpan) {};

  abstract eval(env: Environment): RValue;
}

class AtomNode extends ASTNode {
  constructor(
    readonly RValue: RValue,
    readonly sourceSpan: SourceSpan
  ) {
    super(sourceSpan);
  }

  eval(_: Environment) {
    return this.RValue;
  }
}

class FunAppNode extends ASTNode {
  constructor(
    readonly fn: AtomNode,
    readonly args: ASTNode[],
    readonly sourceSpan: SourceSpan
  ) {
    super(sourceSpan);
  }

  eval(env: Environment): RValue {
    // temporary hack since `this.fn' can only be a variable post well-formed check
    const rValue = env.get(this.fn.RValue.stringify());
    if (isRCallable(rValue)) {
      return rValue.eval(env, this.args.map(node => node.eval(env)), this.fn.sourceSpan);
    } else {
      throw new StageError(
        FC_EXPECTED_FUNCTION_ERR("variable"),
        NO_SOURCE_SPAN
      );
    }
  }
}
