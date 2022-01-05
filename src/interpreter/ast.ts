import {
  Environment,
  EnvironmentValType
} from "./environment.js";
import {
  FA_QUESTION_NOT_BOOL_ERR,
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
import {
  AtomSExpr
} from "./sexpr.js";
import {
  NO_SOURCE_SPAN,
  SourceSpan
} from "./sourcespan.js";

export {
  ASTNode,
  AndNode,
  AtomNode,
  DefnNode,
  EllipsisNode,
  ExprNode,
  FunAppNode,
  OrNode,
  VarDefnNode,
  VarNode,
  isDefnNode
};

type ASTNode =
  | DefnNode
  | ExprNode;
type DefnNode = VarDefnNode;
type ExprNode =
  | AndNode
  | AtomNode
  | EllipsisNode
  | FunAppNode
  | OrNode
  | VarNode;

abstract class ASTNodeBase {
  constructor(
    readonly sourceSpan: SourceSpan,
    readonly isTemplate: boolean = false,
  ) {};

  abstract eval(env: Environment): RValue;
}

class AndNode extends ASTNodeBase {
  constructor(
    readonly args: ASTNodeBase[],
    readonly sourceSpan: SourceSpan,
    readonly isTemplate: boolean
  ) {
    super(sourceSpan, isTemplate);
  }

  eval(env: Environment): RValue {
    let result: RValue = R_FALSE;
    for (const arg of this.args) {
      result = arg.eval(env);
      if (result === R_FALSE) { return result; }
    }
    if (!isRBoolean(result)) {
      throw new StageError(
        FA_QUESTION_NOT_BOOL_ERR("and", result.stringify()),
        this.sourceSpan
      );
    }
    return result;
  }
}

class AtomNode extends ASTNodeBase {
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

class EllipsisNode extends ASTNodeBase {
  constructor(readonly sourceSpan: SourceSpan) {
    super(sourceSpan, true);
  }

  eval(_: Environment): RValue {
    throw "illegal state: evaluating ellipsis";
  }
}

class FunAppNode extends ASTNodeBase {
  constructor(
    readonly fn: VarNode,
    readonly args: ASTNode[],
    readonly sourceSpan: SourceSpan,
    readonly isTemplate: boolean
  ) {
    super(sourceSpan, isTemplate);
  }

  eval(env: Environment): RValue {
    const rval = env.get(
      EnvironmentValType.Function,
      this.fn.name.token.text,
      this.fn.name.sourceSpan
    );
    if (isRCallable(rval)) {
      return rval.eval(env, this.args.map(node => node.eval(env)), this.sourceSpan);
    } else {
      throw new StageError(
        FC_EXPECTED_FUNCTION_ERR("variable"),
        NO_SOURCE_SPAN
      );
    }
  }
}

class OrNode extends ASTNodeBase {
  constructor(
    readonly args: ASTNode[],
    readonly sourceSpan: SourceSpan,
    readonly isTemplate: boolean
  ) {
    super(sourceSpan, isTemplate);
  }

  eval(env: Environment): RValue {
    let result: RValue = R_TRUE;
    for (const arg of this.args) {
      result = arg.eval(env);
      if (result !== R_FALSE) { break; }
    }
    if (!isRBoolean(result)) {
      throw new StageError(
        FA_QUESTION_NOT_BOOL_ERR("or", result.stringify()),
        this.sourceSpan
      );
    }
    return result;
  }
}

class VarNode extends ASTNodeBase {
  constructor(
    readonly name: AtomSExpr
  ) {
    super(name.sourceSpan);
  }

  eval(env: Environment): RValue {
    return env.get(
      EnvironmentValType.Variable,
      this.name.token.text,
      this.name.token.sourceSpan
    );
  }
}

abstract class DefnNodeBase extends ASTNodeBase {
  abstract run(env: Environment): void;
}

class VarDefnNode extends DefnNodeBase {
  constructor(
    readonly defineSourceSpan: SourceSpan,
    readonly name: AtomSExpr,
    readonly value: ASTNode,
    readonly sourceSpan: SourceSpan
  ) {
    super(sourceSpan);
  }

  eval(_: Environment): RValue {
    throw "illegal state: evaluating variable definition";
  }

  run(env: Environment): void {
    env.set(this.name.token.text, this.value.eval(env));
  }
}

function isDefnNode(node: ASTNode): node is DefnNode {
  return node instanceof VarDefnNode;
}
