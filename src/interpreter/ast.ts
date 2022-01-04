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
import {
  AtomSExpr
} from "./sexpr.js";
import {
  NO_SOURCE_SPAN, SourceSpan
} from "./sourcespan.js";

export {
  ASTNode,
  AndNode,
  AtomNode,
  DefnNode,
  ExprNode,
  FunAppNode,
  OrNode,
  VarDefnNode,
  VarNode,
  isDefnNode,
  isExprNode
};

type ASTNode =
  | DefnNode
  | ExprNode;
type DefnNode = VarDefnNode;
type ExprNode =
  | AndNode
  | AtomNode
  | FunAppNode
  | OrNode
  | VarNode;

abstract class ASTNodeBase {
  constructor(readonly sourceSpan: SourceSpan) {};

  abstract eval(env: Environment): RValue;
}

class AndNode extends ASTNodeBase {
  constructor(
    readonly andSourceSpan: SourceSpan,
    readonly args: ASTNodeBase[],
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

class FunAppNode extends ASTNodeBase {
  constructor(
    readonly fn: VarNode,
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

class OrNode extends ASTNodeBase {
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

class VarNode extends ASTNodeBase {
  constructor(
    readonly name: AtomSExpr
  ) {
    super(name.sourceSpan);
  }

  eval(env: Environment): RValue {
    return env.get(this.name.token.text);
  }
}

class VarDefnNode extends ASTNodeBase {
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
}

function isDefnNode(node: ASTNode): node is DefnNode {
  return node instanceof VarDefnNode;
}

function isExprNode(node: ASTNode): node is ExprNode {
  return !isDefnNode(node);
}
