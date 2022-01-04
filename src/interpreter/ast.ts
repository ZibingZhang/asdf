import {
  Environment
} from "./environment.js";
import {
  FA_QUESTION_NOT_BOOL,
  FC_EXPECTED_FUNCTION_ERR
} from "./error.js";
import {
  StageError
} from "./pipeline.js";
import {
  isRBoolean,
  isRCallable,
  RValue,
  R_FALSE,
  R_TRUE
} from "./rvalue.js";
import { AtomSExpr } from "./sexpr.js";
import {
  NO_SOURCE_SPAN, SourceSpan
} from "./sourcespan.js";

export {
  ASTNode,
  AndNode,
  AtomNode,
  FunAppNode,
  OrNode,
  VariableNode
};

abstract class ASTNode {
  constructor(readonly sourceSpan: SourceSpan) {};

  abstract eval(env: Environment): RValue;
}

class AndNode extends ASTNode {
  constructor(
    readonly andSourceSpan: SourceSpan,
    readonly args: ASTNode[],
    readonly sourceSpan: SourceSpan
  ) {
    super(sourceSpan);
  }

  eval(env: Environment): RValue {
    let result: RValue = R_FALSE;
    for (const arg of this.args) {
      result = arg.eval(env);
      if (result === R_FALSE) { return result; }
    }
    if (!isRBoolean(result)) {
      throw new StageError(FA_QUESTION_NOT_BOOL("and", result.stringify()), this.andSourceSpan);
    }
    return result;
  }
}

class AtomNode extends ASTNode {
  constructor(
    readonly rval: RValue,
    readonly sourceSpan: SourceSpan
  ) {
    super(sourceSpan);
  }

  eval(_: Environment) {
    return this.rval;
  }
}

class FunAppNode extends ASTNode {
  constructor(
    readonly fn: VariableNode,
    readonly args: ASTNode[],
    readonly sourceSpan: SourceSpan
  ) {
    super(sourceSpan);
  }

  eval(env: Environment): RValue {
    const rval = env.get(this.fn.name.token.text);
    if (isRCallable(rval)) {
      return rval.eval(env, this.args.map(node => node.eval(env)), this.fn.sourceSpan);
    } else {
      throw new StageError(
        FC_EXPECTED_FUNCTION_ERR("variable"),
        NO_SOURCE_SPAN
      );
    }
  }
}

class OrNode extends ASTNode {
  constructor(
    readonly orSourceSpan: SourceSpan,
    readonly args: ASTNode[],
    readonly sourceSpan: SourceSpan
  ) {
    super(sourceSpan);
  }

  eval(env: Environment): RValue {
    let result: RValue = R_TRUE;
    for (const arg of this.args) {
      result = arg.eval(env);
      if (result !== R_FALSE) { break; }
    }
    if (!isRBoolean(result)) {
      throw new StageError(FA_QUESTION_NOT_BOOL("or", result.stringify()), this.orSourceSpan);
    }
    return result;
  }
}

class VariableNode extends ASTNode {
  constructor(
    readonly name: AtomSExpr
  ) {
    super(name.sourceSpan);
  }

  eval(env: Environment): RValue {
    return env.get(this.name.token.text);
  }
}
