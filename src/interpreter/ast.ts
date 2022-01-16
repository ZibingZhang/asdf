/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  CE_ACTUAL_VALUE_NOT_EXPECTED_ERR,
  CE_CANT_COMPARE_INEXACT_ERR,
  CE_EXPECTED_AN_ERROR_ERR,
  CE_EXPECTED_ERROR_MESSAGE_ERR,
  CE_NOT_IN_RANGE_ERR,
  CE_NOT_MEMBER_OF_ERR,
  CE_NOT_SATISFIED_ERR,
  CE_NOT_WITHIN_ERR,
  CE_SATISFIED_NOT_BOOLEAN_ERR,
  CE_WRONG_ERROR_ERR,
  CN_ALL_QUESTION_RESULTS_FALSE_ERR,
  DF_PREVIOUSLY_DEFINED_NAME_ERR,
  EL_EXPECTED_FINISHED_EXPR_ERR,
  FA_ARITY_ERR,
  FA_MIN_ARITY_ERR,
  FA_NTH_WRONG_TYPE_ERR,
  FA_WRONG_TYPE_ERR,
  FC_EXPECTED_FUNCTION_ERR,
  WF_QUESTION_NOT_BOOL_ERR
} from "./error";
import {
  RCallableVisitor,
  RIsStructFun,
  RLambda,
  RMakeStructFun,
  RPrimFun,
  RStruct,
  RStructGetFun,
  RStructType,
  RTestResult,
  RValue,
  R_FALSE,
  R_TRUE,
  R_VOID,
  isRBoolean,
  isRCallable,
  isRData,
  isRFalse,
  isRInexactReal,
  isRString,
  isRTrue
} from "./rvalue";
import {
  Scope,
  VariableType
} from "./scope";
import {
  AtomSExpr
} from "./sexpr";
import {
  Environment
} from "./environment";
import {
  Global
} from "./global";
import {
  Keyword
} from "./keyword";
import {
  RNG
} from "./random";
import {
  SETTINGS
} from "./settings";
import {
  SourceSpan
} from "./sourcespan";
import {
  StageError
} from "./pipeline";
import {
  UserError
} from "./primitive/misc";
import {
  isFunctionType
} from "./types";

export {
  ASTNode,
  AndNode,
  AtomNode,
  CheckErrorNode,
  CheckMemberOfNode,
  CheckNode,
  CheckRangeNode,
  CheckSatisfiedNode,
  CheckWithinNode,
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
  LetNode,
  LocalNode,
  OrNode,
  RequireNode,
  VarNode,
  isCheckNode,
  isDefnNode,
  isLambdaNode,
  isVarNode,
  ASTNodeVisitor,
  EvaluateRCallableVisitor
};

type ASTNode =
  | CheckNode
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
  | LetNode
  | LocalNode
  | OrNode
  | VarNode;

type DExprNode =
  | ExprNode

abstract class ASTNodeBase {
  used = false;

  constructor(
    readonly sourceSpan: SourceSpan
  ) {}

  abstract accept<T>(visitor: ASTNodeVisitor<T>): T;

  abstract eval(env: Environment): RValue;

  isTemplate(): boolean {
    return false;
  }

  use() {
    this.used = true;
  }
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
    this.used = true;
    let result: RValue = R_FALSE;
    for (const arg of this.args) {
      result = arg.eval(env);
      if (isRFalse(result)) { return result; }
    }
    if (!isRBoolean(result)) {
      throw new StageError(
        WF_QUESTION_NOT_BOOL_ERR(Keyword.And, result.stringify()),
        this.sourceSpan
      );
    }
    return result;
  }

  isTemplate(): boolean {
    return this.args.some(arg => arg.isTemplate());
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
    this.used = true;
    return this.rval;
  }
}

class CheckNode extends ASTNodeBase {
  constructor(
    readonly name: string,
    readonly args: ASTNode[],
    readonly sourceSpan: SourceSpan
  ) {
    super(sourceSpan);
  }

  accept<T>(visitor: ASTNodeVisitor<T>): T {
    return visitor.visitCheckNode(this);
  }

  eval(env: Environment): RValue {
    this.used = true;
    switch (this.name) {
      case Keyword.CheckExpect:
      case Keyword.CheckRandom: {
        let actualVal;
        let expectedVal;
        if (this.name === Keyword.CheckExpect) {
          actualVal = this.args[0].eval(env);
          expectedVal = this.args[1].eval(env);
        } else {
          const seed = new Date().toString() + new Date().getMilliseconds();
          RNG.reset(seed);
          actualVal = this.args[0].eval(env);
          RNG.reset(seed);
          expectedVal = this.args[1].eval(env);
        }
        if (isRInexactReal(actualVal) || isRInexactReal(expectedVal)) {
          return new RTestResult(
            false,
            CE_CANT_COMPARE_INEXACT_ERR(
              this.name,
              actualVal.stringify(),
              expectedVal.stringify()
            ),
            this.sourceSpan
          );
        } else if (isRData(actualVal) && actualVal.equal(expectedVal)) {
          return new RTestResult(true);
        } else {
          return new RTestResult(
            false,
            CE_ACTUAL_VALUE_NOT_EXPECTED_ERR(
              actualVal.stringify(),
              expectedVal.stringify()
            ),
            this.sourceSpan
          );
        }
      }
      default: {
        throw "illegal state: non-implemented test function";
      }
    }
  }
}

class CheckErrorNode extends CheckNode {
  constructor(
    readonly args: ASTNode[],
    readonly sourceSpan: SourceSpan
  ) {
    super(Keyword.CheckError, args, sourceSpan);
  }

  eval(env: Environment): RValue {
    this.used = true;
    let expectedErrMsg: RValue | null = null;
    if (this.args[1]) {
      expectedErrMsg = this.args[1].eval(env);
      if (!isRString(expectedErrMsg)) {
        throw new StageError(
          CE_EXPECTED_ERROR_MESSAGE_ERR(expectedErrMsg.stringify()),
          this.args[1].sourceSpan
        );
      }
    }
    try {
      return new RTestResult(
        false,
        CE_EXPECTED_AN_ERROR_ERR(this.args[0].eval(env).stringify()),
        this.sourceSpan
      );
    } catch (e) {
      if (e instanceof StageError) {
        if (expectedErrMsg && expectedErrMsg.val !== e.msg) {
          return new RTestResult(
            false,
            CE_WRONG_ERROR_ERR(
              expectedErrMsg.val,
              e.msg
            ),
            this.sourceSpan
          );
        }
        return new RTestResult(true);
      } else {
        throw e;
      }
    }
  }
}

class CheckMemberOfNode extends CheckNode {
  constructor(
    readonly arg: ASTNode,
    readonly testValNode: ASTNode,
    readonly testAgainstValNodes: ASTNode[],
    readonly sourceSpan: SourceSpan
  ) {
    super(Keyword.CheckMemberOf, [testValNode, ...testAgainstValNodes], sourceSpan);
  }

  eval(env: Environment): RValue {
    this.used = true;
    const testResult = this.arg.eval(env);
    if (isRFalse(testResult)) {
      return new RTestResult(
        false,
        CE_NOT_MEMBER_OF_ERR(
          this.testValNode.eval(env).stringify(),
          this.testAgainstValNodes.map(node => node.eval(env).stringify())
        ),
        this.sourceSpan
      );
    }
    return new RTestResult(true);
  }
}

class CheckRangeNode extends CheckNode {
  constructor(
    readonly arg: ASTNode,
    readonly testValNode: ASTNode,
    readonly lowerBoundValNode: ASTNode,
    readonly upperBoundValNode: ASTNode,
    readonly sourceSpan: SourceSpan
  ) {
    super(Keyword.CheckRange, [testValNode, lowerBoundValNode, upperBoundValNode], sourceSpan);
  }

  eval(env: Environment): RValue {
    this.used = true;
    const testResult = this.arg.eval(env);
    if (isRFalse(testResult)) {
      return new RTestResult(
        false,
        CE_NOT_IN_RANGE_ERR(
          this.testValNode.eval(env).stringify(),
          this.lowerBoundValNode.eval(env).stringify(),
          this.upperBoundValNode.eval(env).stringify()
        ),
        this.sourceSpan
      );
    }
    return new RTestResult(true);
  }
}

class CheckSatisfiedNode extends CheckNode {
  constructor(
    readonly arg: ASTNode,
    readonly testValNode: ASTNode,
    readonly testFnNode: ASTNode,
    readonly testFnName: string,
    readonly sourceSpan: SourceSpan
  ) {
    super(Keyword.CheckSatisfied, [testValNode, testFnNode], sourceSpan);
  }

  eval(env: Environment): RValue {
    this.used = true;
    const testResult = this.arg.eval(env);
    if (!isRBoolean(testResult)) {
      return new RTestResult(
        false,
        CE_SATISFIED_NOT_BOOLEAN_ERR(
          this.testFnName,
          testResult.stringify()
        ),
        this.sourceSpan
      );
    }
    if (isRFalse(testResult)) {
      return new RTestResult(
        false,
        CE_NOT_SATISFIED_ERR(
          this.testFnName,
          this.testValNode.eval(env).stringify()
        ),
        this.sourceSpan
      );
    }
    return new RTestResult(true);
  }
}

class CheckWithinNode extends CheckNode {
  constructor(
    readonly arg: ASTNode,
    readonly actualNode: ASTNode,
    readonly expectedNode: ASTNode,
    readonly withinNode: ASTNode,
    readonly sourceSpan: SourceSpan
  ) {
    super(Keyword.CheckWithin, [actualNode, expectedNode, withinNode], sourceSpan);
  }

  eval(env: Environment): RValue {
    this.used = true;
    if (isRFalse(this.arg.eval(env))) {
      return new RTestResult(
        false,
        CE_NOT_WITHIN_ERR(
          this.actualNode.eval(env).stringify(),
          this.expectedNode.eval(env).stringify(),
          this.withinNode.eval(env).stringify()
        ),
        this.sourceSpan
      );
    }
    return new RTestResult(true);
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
    this.used = true;
    for (const [question, answer] of this.questionAnswerClauses) {
      const questionResult = question.eval(env);
      if (!isRBoolean(questionResult)) {
        throw new StageError(
          WF_QUESTION_NOT_BOOL_ERR(Keyword.Cond, questionResult.stringify()),
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

  isTemplate(): boolean {
    return this.questionAnswerClauses.some(clause => clause[0].isTemplate() || clause[1].isTemplate());
  }
}

class EllipsisFunAppNode extends ASTNodeBase {
  constructor(
    readonly placeholder: AtomSExpr,
    readonly sourceSpan: SourceSpan
  ) {
    super(sourceSpan);
  }

  accept<T>(visitor: ASTNodeVisitor<T>): T {
    return visitor.visitEllipsisFunAllNode(this);
  }

  eval(_: Environment): RValue {
    throw new StageError(
      EL_EXPECTED_FINISHED_EXPR_ERR(this.placeholder.token.text),
      this.sourceSpan
    );
  }

  isTemplate(): boolean {
    return true;
  }
}

class EllipsisNode extends ASTNodeBase {
  constructor(
    readonly placeholder: AtomSExpr,
    readonly sourceSpan: SourceSpan
  ) {
    super(sourceSpan);
  }

  accept<T>(visitor: ASTNodeVisitor<T>): T {
    return visitor.visitEllipsisNode(this);
  }

  eval(_: Environment): RValue {
    throw new StageError(
      EL_EXPECTED_FINISHED_EXPR_ERR(this.placeholder.token.text),
      this.sourceSpan
    );
  }

  isTemplate(): boolean {
    return true;
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
    this.used = true;
    const rval = env.get(
      this.fn.name,
      this.fn.sourceSpan
    );
    if (isRCallable(rval)) {
      try {
        return rval.accept(new EvaluateRCallableVisitor(
          this.args,
          env,
          this.sourceSpan
        ));
      } catch (e) {
        if (e instanceof UserError) {
          throw new StageError(
            e.message,
            this.sourceSpan
          );
        } else {
          throw e;
        }
      }
    } else {
      throw new StageError(
        FC_EXPECTED_FUNCTION_ERR(
          rval instanceof RStructType
            ? `structure type (do you mean make-${rval.name})`
            : "variable"
        ),
        this.fn.sourceSpan
      );
    }
  }

  isTemplate(): boolean {
    return this.args.some(arg => arg.isTemplate());
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
    this.used = true;
    const questionResult = this.question.eval(env);
    if (!isRBoolean(questionResult)) {
      throw new StageError(
        WF_QUESTION_NOT_BOOL_ERR(Keyword.If, questionResult.stringify()),
        this.sourceSpan
      );
    }
    if (isRTrue(questionResult)) {
      return this.trueAnswer.eval(env);
    } else {
      return this.falseAnswer.eval(env);
    }
  }

  isTemplate(): boolean {
    return this.question.isTemplate() || this.trueAnswer.isTemplate() || this.falseAnswer.isTemplate();
  }
}

class LambdaNode extends ASTNodeBase {
  name: string | null;

  constructor(
    name: string | null,
    readonly params: string[],
    readonly body: ASTNode,
    readonly sourceSpan: SourceSpan
  ) {
    super(sourceSpan);
    this.name = name;
  }

  accept<T>(visitor: ASTNodeVisitor<T>): T {
    return visitor.visitLambdaNode(this);
  }

  eval(env: Environment): RValue {
    this.used = true;
    return new RLambda(env.copy(), this.params, this.body);
  }

  isTemplate(): boolean {
    return this.body.isTemplate();
  }
}

class LetNode extends ASTNodeBase {
  constructor(
    readonly name: string,
    readonly bindings: [VarNode, ASTNode][],
    readonly body: ASTNode,
    readonly sourceSpan: SourceSpan
  ) {
    super(sourceSpan);
  }

  accept<T>(visitor: ASTNodeVisitor<T>): T {
    return visitor.visitLetNode(this);
  }

  eval(env: Environment): RValue {
    switch (this.name) {
      case "letrec":
      case "let*": {
        const childEnv = new Environment(env);
        this.bindings.forEach(([variable, expr]) => {
          childEnv.set(variable.name, expr.eval(childEnv));
        });
        return this.body.eval(childEnv);
      }
      case "let": {
        const childEnv = new Environment(env);
        this.bindings.forEach(([variable, expr]) => {
          childEnv.set(variable.name, expr.eval(env));
        });
        return this.body.eval(childEnv);
      }
      default: {
        throw "illegal state: unsupported let-style expression";
      }
    }
  }
}

class LocalNode extends ASTNodeBase {
  constructor(
    readonly defns: DefnNode[],
    readonly body: ASTNode,
    readonly sourceSpan: SourceSpan
  ) {
    super(sourceSpan);
  }

  accept<T>(visitor: ASTNodeVisitor<T>): T {
    return visitor.visitLocalNode(this);
  }

  eval(env: Environment): RValue {
    this.used = true;
    const childEnv = new Environment(env);
    this.defns.forEach(defn => defn.eval(childEnv));
    return this.body.eval(childEnv);
  }

  isTemplate(): boolean {
    return this.defns.some(defn => defn.isTemplate()) || this.body.isTemplate();
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
    this.used = true;
    let result: RValue = R_TRUE;
    for (const arg of this.args) {
      result = arg.eval(env);
      if (result !== R_FALSE) { break; }
    }
    if (!isRBoolean(result)) {
      throw new StageError(
        WF_QUESTION_NOT_BOOL_ERR(Keyword.Or, result.stringify()),
        this.sourceSpan
      );
    }
    return result;
  }

  isTemplate(): boolean {
    return this.args.some(arg => arg.isTemplate());
  }
}

class RequireNode extends ASTNodeBase {
  constructor(
    readonly name: string,
    readonly nameSourceSpan: SourceSpan,
    readonly sourceSpan: SourceSpan
  ) {
    super(sourceSpan);
  }

  accept<T>(visitor: ASTNodeVisitor<T>): T {
    return visitor.visitRequireNode(this);
  }

  eval(_: Environment): RValue {
    this.used = true;
    throw "illegal state: no possible modules to load";
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
    this.used = true;
    return env.get(
      this.name,
      this.sourceSpan
    );
  }
}

abstract class DefnNodeBase extends ASTNodeBase {
  constructor(
    readonly name: string,
    readonly nameSourceSpan: SourceSpan,
    readonly sourceSpan: SourceSpan
  ) {
    super(sourceSpan);
  }

  addToScope(scope: Scope): void {
    if (scope.has(this.name)) {
      throw new StageError(
        DF_PREVIOUSLY_DEFINED_NAME_ERR(this.name),
        this.nameSourceSpan
      );
    }
  }
}

class DefnStructNode extends DefnNodeBase {
  private global = new Global();

  constructor(
    readonly name: string,
    readonly nameSourceSpan: SourceSpan,
    readonly fields: string[],
    readonly sourceSpan: SourceSpan
  ) {
    super(
      name,
      nameSourceSpan,
      sourceSpan
    );
  }

  accept<T>(visitor: ASTNodeVisitor<T>): T {
    return visitor.visitDefnStructNode(this);
  }

  eval(env: Environment): RValue {
    this.used = true;
    env.set(this.name, new RStructType(this.name));
    env.set(`make-${this.name}`, new RMakeStructFun(this.name, this.fields.length));
    env.set(`${this.name}?`, new RIsStructFun(this.name));
    this.fields.forEach((field, idx) => {
      env.set(`${this.name}-${field}`, new RStructGetFun(this.name, field, idx));
    });
    return R_VOID;
  }

  addToScope(scope: Scope, allowShadow = false): void {
    if (!allowShadow) {
      super.addToScope(scope);
      if (scope.has(`make-${this.name}`)) {
        throw new StageError(
          DF_PREVIOUSLY_DEFINED_NAME_ERR(`make-${this.name}`),
          this.sourceSpan
        );
      }
      if (scope.has(`${this.name}?`)) {
        throw new StageError(
          DF_PREVIOUSLY_DEFINED_NAME_ERR(`${this.name}?`),
          this.sourceSpan
        );
      }
      this.fields.forEach(field => {
        if (scope.has(`${this.name}-${field}`)) {
          throw new StageError(
            DF_PREVIOUSLY_DEFINED_NAME_ERR(`${this.name}-${field}`),
            this.sourceSpan
          );
        }
      });
    }
    scope.set(this.name, VariableType.StructureType);
    scope.set(
      `make-${this.name}`,
      VariableType.UserDefinedFunction
    );
    scope.set(
      `${this.name}?`,
      VariableType.UserDefinedFunction
    );
    this.fields.forEach(field => {
      scope.set(
        `${this.name}-${field}`,
        VariableType.UserDefinedFunction
      );
    });
  }
}

class DefnVarNode extends DefnNodeBase {
  private global = new Global();

  constructor(
    readonly name: string,
    readonly nameSourceSpan: SourceSpan,
    readonly value: ExprNode,
    readonly sourceSpan: SourceSpan
  ) {
    super(
      name,
      nameSourceSpan,
      sourceSpan
    );
  }

  accept<T>(visitor: ASTNodeVisitor<T>): T {
    return visitor.visitDefnVarNode(this);
  }

  eval(env: Environment): RValue {
    this.used = true;
    env.set(this.name, this.value.eval(env));
    return R_VOID;
  }

  isTemplate(): boolean {
    return this.value.isTemplate();
  }

  addToScope(scope: Scope, allowShadow = false): void {
    if (!allowShadow) {
      super.addToScope(scope);
    }
    if (this.value instanceof LambdaNode) {
      scope.set(
        this.name,
        VariableType.UserDefinedFunction
      );
    } else {
      scope.set(this.name, VariableType.Data);
    }
  }
}

function isCheckNode(node: ASTNode) {
  return node instanceof CheckNode;
}

function isDefnNode(node: ASTNode): node is DefnNode {
  return node instanceof DefnStructNode
    || node instanceof DefnVarNode;
}

function isLambdaNode(node: ASTNode): node is LambdaNode {
  return node instanceof LambdaNode;
}

function isVarNode(node: ASTNode): node is VarNode {
  return node instanceof VarNode;
}

interface ASTNodeVisitor<T> {
  visitAndNode(node: AndNode): T;
  visitAtomNode(node: AtomNode): T;
  visitCheckNode(node: CheckNode): T;
  visitCondNode(node: CondNode): T;
  visitDefnVarNode(node: DefnVarNode): T;
  visitDefnStructNode(node: DefnStructNode): T;
  visitEllipsisFunAllNode(node: EllipsisFunAppNode): T;
  visitEllipsisNode(node: EllipsisNode): T;
  visitFunAppNode(node: FunAppNode): T;
  visitIfNode(node: IfNode): T;
  visitLambdaNode(node: LambdaNode): T;
  visitLetNode(node: LetNode): T;
  visitLocalNode(node: LocalNode): T;
  visitOrNode(node: OrNode): T;
  visitRequireNode(node: RequireNode): T;
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
        FA_ARITY_ERR(`${rval.name}?`, 1, this.args.length),
        this.sourceSpan
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
        this.sourceSpan
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
    const argsLength = this.args.length;
    if (
      SETTINGS.primitives.relaxedConditions.includes(rval.name)
      && rval.config.relaxedMinArity !== undefined
    ) {
      if (argsLength < rval.config.relaxedMinArity) {
        throw new StageError(
          FA_MIN_ARITY_ERR(rval.name, rval.config.relaxedMinArity, argsLength),
          this.sourceSpan
        );
      }
    } else if (rval.config.minArity && argsLength < rval.config.minArity) {
      throw new StageError(
        FA_MIN_ARITY_ERR(rval.name, rval.config.minArity, argsLength),
        this.sourceSpan
      );
    }
    const funType = rval.getType(this.args.length);
    if (argsLength !== funType.paramTypes.length) {
      throw new StageError(
        FA_ARITY_ERR(rval.name, funType.paramTypes.length, argsLength),
        this.sourceSpan
      );
    }
    const argVals = this.args.map(arg => arg.eval(this.env));
    for (const [idx, paramType] of funType.paramTypes.entries()) {
      const argVal = argVals[idx];
      const argType = argVal.getType(argsLength);
      if (isFunctionType(paramType)) {
        if (argType.isSuperTypeOf(paramType)) {
          continue;
        }
      } else {
        if (paramType.isSuperTypeOf(argType)) {
          continue;
        }
      }
      if (funType.paramTypes.length === 1) {
        throw new StageError(
          FA_WRONG_TYPE_ERR(rval.name, paramType.stringify(), argVal.stringify()),
          this.sourceSpan
        );
      } else {
        throw new StageError(
          FA_NTH_WRONG_TYPE_ERR(rval.name, paramType.stringify(), idx, argVal.stringify()),
          this.sourceSpan
        );
      }
    }
    return rval.call(argVals, this.sourceSpan, this.env);
  }

  visitRStructGetFun(rval: RStructGetFun): RValue {
    if (this.args.length !== 1) {
      throw new StageError(
        FA_ARITY_ERR(`${rval.name}-${rval.fieldName}`, 1, this.args.length),
        this.sourceSpan
      );
    }
    const argVal = this.args[0].eval(this.env);
    if (!(argVal instanceof RStruct) || argVal.name != rval.name) {
      throw new StageError(
        FA_WRONG_TYPE_ERR(`${rval.name}-${rval.fieldName}`, rval.name, argVal.stringify()),
        this.sourceSpan
      );
    }
    return argVal.vals[rval.idx];
  }
}
