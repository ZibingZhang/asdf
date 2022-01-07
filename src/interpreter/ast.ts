import {
  Environment
} from "./environment.js";
import {
  EL_EXPECT_FINISHED_EXPR_ERR,
  FA_ARITY_ERR,
  FA_QUESTION_NOT_BOOL_ERR,
  FC_EXPECTED_FUNCTION_ERR
} from "./error.js";
import {
  StageError
} from "./pipeline.js";
import {
  isRBoolean,
  isRCallable,
  isRPrimFun,
  isRTrue,
  RLambda,
  RMakeStructFun,
  RPrimFun,
  RStruct,
  RValue,
  R_FALSE,
  R_NONE,
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
  DASTNode,
  DefnNode,
  DefnStructNode,
  DefnVarNode,
  DExprNode,
  EllipsisFunAppNode,
  EllipsisNode,
  ExprNode,
  FunAppNode,
  IfNode,
  LambdaNode,
  MakeStructNode,
  OrNode,
  VarNode,
  isDefnNode
};

type ASTNode =
  | DefnNode
  | ExprNode;
type DASTNode =
| DefnVarNode
| DExprNode;

type DefnNode =
| DefnStructNode
| DefnVarNode;
type ExprNode =
  | AndNode
  | AtomNode
  | EllipsisFunAppNode
  | EllipsisNode
  | FunAppNode
  | IfNode
  | LambdaNode
  | OrNode
  | VarNode;

type DExprNode =
  | ExprNode
  | MakeStructNode

abstract class ASTNodeBase {
  constructor(
    readonly sourceSpan: SourceSpan
  ) {}

  abstract eval(env: Environment): RValue;
}

class AndNode extends ASTNodeBase {
  constructor(
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

class DefnStructNode extends ASTNodeBase {
  constructor(
    readonly name: string,
    readonly params: string[],
    readonly sourceSpan: SourceSpan
  ) {
    super(sourceSpan);
  }

  eval(_: Environment): RValue {
    throw "illegal state: structure definition should have been desugared";
  }
}

class DefnVarNode extends ASTNodeBase {
  constructor(
    readonly name: string,
    readonly nameSourceSpan: SourceSpan,
    readonly value: ExprNode,
    readonly sourceSpan: SourceSpan
  ) {
    super(sourceSpan);
  }

  eval(env: Environment): RValue {
    env.set(this.name, this.value.eval(env));
    return R_NONE;
  }
}

class EllipsisFunAppNode extends ASTNodeBase {
  constructor(readonly sourceSpan: SourceSpan) {
    super(sourceSpan);
  }

  eval(_: Environment): RValue {
    throw new StageError(
      EL_EXPECT_FINISHED_EXPR_ERR,
      this.sourceSpan
    );
  }
}

class EllipsisNode extends ASTNodeBase {
  constructor(readonly sourceSpan: SourceSpan) {
    super(sourceSpan);
  }

  eval(_: Environment): RValue {
    throw new StageError(
      EL_EXPECT_FINISHED_EXPR_ERR,
      this.sourceSpan
    );
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
    const rval = env.get(
      this.fn.name.token.text,
      this.fn.name.sourceSpan
    );
    if (isRCallable(rval)) {
      if (rval instanceof RMakeStructFun) {
        if (rval.arity !== this.args.length) {
          throw new StageError(
            FA_ARITY_ERR(rval.name, rval.arity, this.args.length),
            NO_SOURCE_SPAN
          );
        }
        return rval.eval(this.args.map(node => node.eval(env)));
      } else if (rval instanceof RPrimFun) {
        return rval.eval(env, this.args.map(node => node.eval(env)), this.sourceSpan);
      } else {
        const paramEnv = new Environment();
        for (let idx = 0; idx < this.args.length; idx++) {
          paramEnv.set(rval.params[idx], this.args[idx].eval(env));
        }
        return rval.eval(paramEnv, env);
      }
    } else {
      throw new StageError(
        FC_EXPECTED_FUNCTION_ERR("variable"),
        NO_SOURCE_SPAN
      );
    }
  }
}

class IfNode extends ASTNodeBase {
  constructor(
    readonly question: ASTNode,
    readonly trueAnswer: ASTNode,
    readonly falseAnswer: ASTNode,
    readonly sourceSpan: SourceSpan
  ) {
    super(sourceSpan);
  }

  eval(env: Environment): RValue {
    const questionResult = this.question.eval(env);
    if (!isRBoolean(questionResult)) {
      throw new StageError(
        FA_QUESTION_NOT_BOOL_ERR("if", questionResult.stringify()),
        this.sourceSpan
      );
    }
    if (isRTrue(questionResult)) {
      return this.trueAnswer.eval(env);
    } else {
      return this.falseAnswer.eval(env);
    }
  }
}

class LambdaNode extends ASTNodeBase {
  constructor(
    readonly params: string[],
    readonly body: ASTNode,
    readonly sourceSpan: SourceSpan
  ) {
    super(sourceSpan);
  }

  eval(env: Environment): RValue {
    return new RLambda(env.copy(), this.params, this.body);
  }
}

class MakeStructNode extends ASTNodeBase {
  constructor(
    readonly name: string,
    readonly arity: number,
    readonly sourceSpan: SourceSpan
  ) {
    super(sourceSpan);
  }

  eval(_: Environment): RMakeStructFun {
    return new RMakeStructFun(this.name, this.arity);
  }
}

class OrNode extends ASTNodeBase {
  constructor(
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
      this.name.token.text,
      this.name.token.sourceSpan
    );
  }
}

function isDefnNode(node: ASTNode): node is DefnNode {
  return node instanceof DefnStructNode
    || node instanceof DefnVarNode;
}
