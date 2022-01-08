import {
  Environment
} from "./environment.js";
import {
  CN_ALL_QUESTION_RESULTS_FALSE_ERR,
  EL_EXPECTED_FINISHED_EXPR_ERR,
  FA_ARITY_ERR,
  FA_MIN_ARITY_ERR,
  FA_NTH_WRONG_TYPE_ERR,
  FA_WRONG_TYPE_ERR,
  FC_EXPECTED_FUNCTION_ERR,
  WF_QUESTION_NOT_BOOL_ERR
} from "./error.js";
import {
  StageError
} from "./pipeline.js";
import {
  isRBoolean,
  isRCallable,
  isRTrue,
  RCallableVisitor,
  RIsStructFun,
  RLambda,
  RMakeStructFun,
  RPrimFun,
  RPrimTestFun,
  RStruct,
  RStructGetFun,
  RStructType,
  RValue,
  R_FALSE,
  R_TRUE,
  R_VOID
} from "./rvalue.js";
import {
  NO_SOURCE_SPAN,
  SourceSpan
} from "./sourcespan.js";

export {
  ASTNode,
  AndNode,
  AtomNode,
  CondNode,
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
  OrNode,
  VarNode,
  isDefnNode,
  ASTNodeVisitor
};

type ASTNode =
  | DefnNode
  | ExprNode;

type DefnNode =
| DefnStructNode
| DefnVarNode;
type ExprNode =
  | AndNode
  | AtomNode
  | CondNode
  | EllipsisFunAppNode
  | EllipsisNode
  | FunAppNode
  | IfNode
  | LambdaNode
  | OrNode
  | VarNode;

type DExprNode =
  | ExprNode

abstract class ASTNodeBase {
  constructor(
    readonly sourceSpan: SourceSpan
  ) {}

  abstract accept<T>(visitor: ASTNodeVisitor<T>): T;

  abstract eval(env: Environment): RValue;
}

class AndNode extends ASTNodeBase {
  constructor(
    readonly args: ASTNodeBase[],
    readonly sourceSpan: SourceSpan
  ) {
    super(sourceSpan);
  }

  accept<T>(visitor: ASTNodeVisitor<T>): T {
    return visitor.visitAndNode(this);
  }

  eval(env: Environment): RValue {
    let result: RValue = R_FALSE;
    for (const arg of this.args) {
      result = arg.eval(env);
      if (result === R_FALSE) { return result; }
    }
    if (!isRBoolean(result)) {
      throw new StageError(
        WF_QUESTION_NOT_BOOL_ERR("and", result.stringify()),
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

  accept<T>(visitor: ASTNodeVisitor<T>): T {
    return visitor.visitAtomNode(this);
  }

  eval(_: Environment) {
    return this.rval;
  }
}

class CondNode extends ASTNodeBase {
  constructor(
    readonly questionAnswerClauses: [ASTNode, ASTNode][],
    readonly sourceSpan: SourceSpan
  ) {
    super(sourceSpan);
  }

  accept<T>(visitor: ASTNodeVisitor<T>): T {
    return visitor.visitCondNode(this);
  }

  eval(env: Environment): RValue {
    for (const [question, answer] of this.questionAnswerClauses) {
      const questionResult = question.eval(env);
      if (!isRBoolean(questionResult)) {
        throw new StageError(
          WF_QUESTION_NOT_BOOL_ERR("cond", questionResult.stringify()),
          this.sourceSpan
        );
      }
      if (questionResult === R_TRUE) { return answer.eval(env); }
    }
    throw new StageError(
      CN_ALL_QUESTION_RESULTS_FALSE_ERR,
      this.sourceSpan
    );
  }
}

class DefnStructNode extends ASTNodeBase {
  constructor(
    readonly name: string,
    readonly fields: string[],
    readonly sourceSpan: SourceSpan
  ) {
    super(sourceSpan);
  }

  accept<T>(visitor: ASTNodeVisitor<T>): T {
    return visitor.visitDefnStructNode(this);
  }

  eval(env: Environment): RValue {
    env.set(this.name, new RStructType(this.name));
    env.set(`make-${this.name}`, new RMakeStructFun(this.name, this.fields.length));
    env.set(`${this.name}?`, new RIsStructFun(this.name));
    this.fields.forEach((field, idx) => {
      env.set(`${this.name}-${field}`, new RStructGetFun(this.name, field, idx));
    });
    return R_VOID;
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

  accept<T>(visitor: ASTNodeVisitor<T>): T {
    return visitor.visitDefnVarNode(this);
  }

  eval(env: Environment): RValue {
    env.set(this.name, this.value.eval(env));
    return R_VOID;
  }
}

class EllipsisFunAppNode extends ASTNodeBase {
  constructor(readonly sourceSpan: SourceSpan) {
    super(sourceSpan);
  }

  accept<T>(visitor: ASTNodeVisitor<T>): T {
    return visitor.visitEllipsisFunAllNode(this);
  }

  eval(_: Environment): RValue {
    throw new StageError(
      EL_EXPECTED_FINISHED_EXPR_ERR,
      this.sourceSpan
    );
  }
}

class EllipsisNode extends ASTNodeBase {
  constructor(readonly sourceSpan: SourceSpan) {
    super(sourceSpan);
  }

  accept<T>(visitor: ASTNodeVisitor<T>): T {
    return visitor.visitEllipsisNode(this);
  }

  eval(_: Environment): RValue {
    throw new StageError(
      EL_EXPECTED_FINISHED_EXPR_ERR,
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

  accept<T>(visitor: ASTNodeVisitor<T>): T {
    return visitor.visitFunAppNode(this);
  }

  eval(env: Environment): RValue {
    const rval = env.get(
      this.fn.name,
      this.fn.sourceSpan
    );
    if (isRCallable(rval)) {
      return rval.accept(new EvaluateRCallableVisitor(
        this.args,
        env,
        this.sourceSpan
      ));
    } else {
      throw new StageError(
        FC_EXPECTED_FUNCTION_ERR(
          rval instanceof RStructType
            ? `structure type (do you mean make-${rval.name})`
            : "variable"
        ),
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

  accept<T>(visitor: ASTNodeVisitor<T>): T {
    return visitor.visitIfNode(this);
  }

  eval(env: Environment): RValue {
    const questionResult = this.question.eval(env);
    if (!isRBoolean(questionResult)) {
      throw new StageError(
        WF_QUESTION_NOT_BOOL_ERR("if", questionResult.stringify()),
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

  accept<T>(visitor: ASTNodeVisitor<T>): T {
    return visitor.visitLambdaNode(this);
  }

  eval(env: Environment): RValue {
    return new RLambda(env.copy(), this.params, this.body);
  }
}

class OrNode extends ASTNodeBase {
  constructor(
    readonly args: ASTNode[],
    readonly sourceSpan: SourceSpan
  ) {
    super(sourceSpan);
  }

  accept<T>(visitor: ASTNodeVisitor<T>): T {
    return visitor.visitOrNode(this);
  }

  eval(env: Environment): RValue {
    let result: RValue = R_TRUE;
    for (const arg of this.args) {
      result = arg.eval(env);
      if (result !== R_FALSE) { break; }
    }
    if (!isRBoolean(result)) {
      throw new StageError(
        WF_QUESTION_NOT_BOOL_ERR("or", result.stringify()),
        this.sourceSpan
      );
    }
    return result;
  }
}

class VarNode extends ASTNodeBase {
  constructor(
    readonly name: string,
    readonly sourceSpan: SourceSpan
  ) {
    super(sourceSpan);
  }

  accept<T>(visitor: ASTNodeVisitor<T>): T {
    return visitor.visitVarNode(this);
  }

  eval(env: Environment): RValue {
    return env.get(
      this.name,
      this.sourceSpan
    );
  }
}

function isDefnNode(node: ASTNode): node is DefnNode {
  return node instanceof DefnStructNode
    || node instanceof DefnVarNode;
}

interface ASTNodeVisitor<T> {
  visitAndNode(node: AndNode): T;
  visitAtomNode(node: AtomNode): T;
  visitCondNode(node: CondNode): T;
  visitDefnVarNode(node: DefnVarNode): T;
  visitDefnStructNode(node: DefnStructNode): T;
  visitEllipsisFunAllNode(node: EllipsisFunAppNode): T;
  visitEllipsisNode(node: EllipsisNode): T;
  visitFunAppNode(node: FunAppNode): T;
  visitIfNode(node: IfNode): T;
  visitLambdaNode(node: LambdaNode): T;
  visitOrNode(node: OrNode): T;
  visitVarNode(node: VarNode): T;
}

class EvaluateRCallableVisitor implements RCallableVisitor<RValue> {
  constructor(
    readonly args: ASTNode[],
    readonly env: Environment,
    readonly sourceSpan: SourceSpan
  ) {}

  visitRIsStructFun(rval: RIsStructFun): RValue {
    if (this.args.length !== 1) {
      throw new StageError(
        FA_ARITY_ERR(rval.name, 1, this.args.length),
        NO_SOURCE_SPAN
      );
    }
    const argVal = this.args[0].eval(this.env);
    if (argVal instanceof RStruct && argVal.name === rval.name) {
      return R_TRUE;
    } else {
      return R_FALSE;
    }
  }

  visitRMakeStructFun(rval: RMakeStructFun): RValue {
    if (rval.arity !== this.args.length) {
      throw new StageError(
        FA_ARITY_ERR(`make-${rval.name}`, rval.arity, this.args.length),
        NO_SOURCE_SPAN
      );
    }
    return new RStruct(rval.name, this.args.map(node => node.eval(this.env)));
  }

  visitRLambda(rval: RLambda): RValue {
    const paramEnv = new Environment();
    for (let idx = 0; idx < this.args.length; idx++) {
      paramEnv.set(rval.params[idx], this.args[idx].eval(this.env));
    }
    const closureCopy = rval.closure.copy();
    closureCopy.parentEnv = this.env;
    paramEnv.parentEnv = closureCopy;
    return rval.body.eval(paramEnv);
  }

  visitRPrimFun(rval: RPrimFun): RValue {
    if (rval.config.minArity && this.args.length < rval.config.minArity) {
      throw new StageError(
        FA_MIN_ARITY_ERR(rval.name, rval.config.minArity, this.args.length),
        this.sourceSpan
      );
    }
    if (rval.config.arity && this.args.length !== rval.config.arity) {
      throw new StageError(
        FA_ARITY_ERR(rval.name, rval.config.arity, this.args.length),
        this.sourceSpan
      );
    }
    const argVals = this.args.map(arg => arg.eval(this.env));
    if (rval.config.onlyArgTypeName) {
      const typeGuard = rval.typeGuardOf(rval.config.onlyArgTypeName);
      if (!typeGuard(argVals[0])) {
        throw new StageError(
          FA_WRONG_TYPE_ERR(rval.name, rval.config.onlyArgTypeName, argVals[0].stringify()),
          this.sourceSpan
        );
      }
    }
    if (rval.config.allArgsTypeName) {
      const typeGuard = rval.typeGuardOf(rval.config.allArgsTypeName);
      for (const [idx, argVal] of argVals.entries()) {
        if (!typeGuard(argVal)) {
          throw new StageError(
            FA_NTH_WRONG_TYPE_ERR(rval.name, rval.config.allArgsTypeName, idx, argVal.stringify()),
            this.sourceSpan
          );
        }
      }
    }
    if (rval.config.argsTypeNames) {
      for (const [idx, argVal] of argVals.entries()) {
        const typeGuard = rval.typeGuardOf(rval.config.argsTypeNames[idx]);
        if (!typeGuard(argVal)) {
          throw new StageError(
            FA_NTH_WRONG_TYPE_ERR(rval.name, rval.config.argsTypeNames[idx], idx, argVal.stringify()),
            this.sourceSpan
          );
        }
      }
    }
    return rval.call(argVals, this.sourceSpan);
  }

  visitRPrimTestFun(_: RPrimTestFun): RValue {
    return R_VOID;
  }

  visitRStructGetFun(rval: RStructGetFun): RValue {
    if (this.args.length !== 1) {
      throw new StageError(
        FA_ARITY_ERR(rval.name, 1, this.args.length),
        NO_SOURCE_SPAN
      );
    }
    const argVal = this.args[0].eval(this.env);
    if (!(argVal instanceof RStruct) || argVal.name != rval.name) {
      throw new StageError(
        FA_WRONG_TYPE_ERR(`${rval.name}-${rval.fieldName}`, rval.name, argVal.stringify()),
        NO_SOURCE_SPAN
      );
    }
    return argVal.vals[rval.idx];
  }
}
