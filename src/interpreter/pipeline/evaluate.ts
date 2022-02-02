import {
  ASTNode,
  ASTNodeVisitor,
  AndNode,
  AtomNode,
  CheckErrorNode,
  CheckMemberOfNode,
  CheckNode,
  CheckRangeNode,
  CheckSatisfiedNode,
  CheckWithinNode,
  CondNode,
  DefnStructNode,
  DefnVarNode,
  EllipsisProcAppNode,
  EllipsisNode,
  ProcAppNode,
  IfNode,
  LambdaNode,
  LetNode,
  LocalNode,
  OrNode,
  RequireNode,
  VarNode,
  isCheckNode,
  isDefnNode,
  isVarNode
} from "../ir/ast";
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
  EL_EXPECTED_FINISHED_EXPR_ERR,
  FA_ARITY_ERR,
  FA_MIN_ARITY_ERR,
  FA_NTH_WRONG_TYPE_ERR,
  FA_WRONG_TYPE_ERR,
  FC_EXPECTED_FUNCTION_ERR,
  HO_EXPECTED_LIST_ARGUMENT_ERR,
  RT_MAX_CALL_STACK_SIZE_ERR, WF_QUESTION_NOT_BOOL_ERR
} from "../error";
import {
  NO_SOURCE_SPAN,
  SourceSpan
} from "../data/sourcespan";
import {
  RComposedProcedure,
  RLambda,
  RMakeStructFun,
  RPrimProc,
  RProcedureVisitor,
  RStruct,
  RStructGetProc,
  RStructHuhProc,
  RStructType,
  RTestResult,
  RValue,
  R_FALSE,
  R_TRUE,
  R_VOID,
  isRBoolean,
  isRData,
  isRFalse,
  isRInexactReal,
  isRProcedure,
  isRString,
  isRStructType,
  isRTrue
} from "../values/rvalue";
import {
  Stage,
  StageError,
  StageOutput,
  StageTestResult
} from "../data/stage";
import {
  Environment
} from "../data/environment";
import {
  Keyword
} from "../data/keyword";
import {
  Program
} from "../ir/program";
import {
  RNG
} from "../random";
import {
  SETTINGS
} from "../settings";
import {
  UserError
} from "../primitive/misc";

export {
  EvaluateCode,
  EvaluateRProcedureVisitor
};

class EvaluateCode extends ASTNodeVisitor<RValue> implements Stage<Program, RValue[]> {
  private globalEnv = new Environment();
  private env = new Environment();
  private testResults: StageTestResult[] = [];

  reset() {
    this.globalEnv = new Environment();
    this.env = new Environment();
  }

  run(input: StageOutput<Program>): StageOutput<RValue[]> {
    this.testResults = [];
    try {
      const program = input.output;
      program.defns.forEach(defn => {
        defn.accept(this, this.globalEnv);
        if (isDefnNode(defn)) {
          defn.used = false;
        }
      });
      const output: RValue[] = [];
      for (const node of program.nodes) {
        let result;
        if (isCheckNode(node)) {
          result = node.accept(this, this.globalEnv);
        } else {
          result = node.accept(this, this.env);
        }
        if (result instanceof RTestResult) {
          this.testResults.push(new StageTestResult(
            result.passed,
            result.msg,
            result.sourceSpan
          ));
        } else if (result !== R_VOID) {
          output.push(result);
        }
      }
      return new StageOutput(output, [], this.testResults);
    } catch (e) {
      if (e instanceof StageError) {
        return new StageOutput([], [e], this.testResults);
      } else if (e instanceof Error && e.message === "too much recursion") {
        return new StageOutput(
          [],
          [
            new StageError(
              RT_MAX_CALL_STACK_SIZE_ERR,
              NO_SOURCE_SPAN
            )
          ],
          this.testResults
        );
      } else {
        throw e;
      }
    }
  }

  visitAndNode(node: AndNode, [env, ..._]: [Environment, never[]]): RValue {
    node.used = true;
    let result: RValue = R_FALSE;
    for (const arg of node.args) {
      result = arg.accept(this, env);
      if (isRFalse(result)) { return result; }
    }
    if (!isRBoolean(result)) {
      throw new StageError(
        WF_QUESTION_NOT_BOOL_ERR(Keyword.And, result.stringify()),
        node.sourceSpan
      );
    }
    return result;
  }

  visitAtomNode(node: AtomNode): RValue {
    node.used = true;
    return node.rval;
  }

  visitCheckNode(node: CheckNode, [env, ..._]: [Environment, never[]]): RValue {
    node.used = true;
    switch (node.name) {
      case Keyword.CheckExpect:
      case Keyword.CheckRandom: {
        let actualVal;
        let expectedVal;
        if (node.name === Keyword.CheckExpect) {
          actualVal = node.args[0].accept(this, env);
          expectedVal = node.args[1].accept(this, env);
        } else {
          const seed = new Date().toString() + new Date().getMilliseconds();
          RNG.reset(seed);
          actualVal = node.args[0].accept(this, env);
          RNG.reset(seed);
          expectedVal = node.args[1].accept(this, env);
        }
        if (isRInexactReal(actualVal) || isRInexactReal(expectedVal)) {
          return new RTestResult(
            false,
            CE_CANT_COMPARE_INEXACT_ERR(
              node.name,
              actualVal.stringify(),
              expectedVal.stringify()
            ),
            node.sourceSpan
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
            node.sourceSpan
          );
        }
      }
      default: {
        throw "illegal state: non-implemented test function";
      }
    }
  }

  visitCheckErrorNode(node: CheckErrorNode, [env, ..._]: [Environment, never[]]): RValue {
    node.used = true;
    let expectedErrMsg: RValue | null = null;
    if (node.args[1]) {
      expectedErrMsg = node.args[1].accept(this, env);
      if (!isRString(expectedErrMsg)) {
        throw new StageError(
          CE_EXPECTED_ERROR_MESSAGE_ERR(expectedErrMsg.stringify()),
          node.args[1].sourceSpan
        );
      }
    }
    try {
      return new RTestResult(
        false,
        CE_EXPECTED_AN_ERROR_ERR(node.args[0].accept(this, env).stringify()),
        node.sourceSpan
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
            node.sourceSpan
          );
        }
        return new RTestResult(true);
      } else {
        throw e;
      }
    }
  }

  visitCheckMemberOfNode(node: CheckMemberOfNode, [env, ..._]: [Environment, never[]]): RValue {
    node.used = true;
    const testResult = node.arg.accept(this, env);
    if (isRFalse(testResult)) {
      return new RTestResult(
        false,
        CE_NOT_MEMBER_OF_ERR(
          node.testValNode.accept(this, env).stringify(),
          node.testAgainstValNodes.map(node => node.accept(this, env).stringify())
        ),
        node.sourceSpan
      );
    }
    return new RTestResult(true);
  }

  visitCheckRangeNode(node: CheckRangeNode, [env, ..._]: [Environment, never[]]): RValue {
    node.used = true;
    const testResult = node.arg.accept(this, env);
    if (isRFalse(testResult)) {
      return new RTestResult(
        false,
        CE_NOT_IN_RANGE_ERR(
          node.testValNode.accept(this, env).stringify(),
          node.lowerBoundValNode.accept(this, env).stringify(),
          node.upperBoundValNode.accept(this, env).stringify()
        ),
        node.sourceSpan
      );
    }
    return new RTestResult(true);
  }

  visitCheckSatisfiedNode(node: CheckSatisfiedNode, [env, ..._]: [Environment, never[]]): RValue {
    node.used = true;
    const testResult = node.arg.accept(this, env);
    if (!isRBoolean(testResult)) {
      return new RTestResult(
        false,
        CE_SATISFIED_NOT_BOOLEAN_ERR(
          node.testFnName,
          testResult.stringify()
        ),
        node.sourceSpan
      );
    }
    if (isRFalse(testResult)) {
      return new RTestResult(
        false,
        CE_NOT_SATISFIED_ERR(
          node.testFnName,
          node.testValNode.accept(this, env).stringify()
        ),
        node.sourceSpan
      );
    }
    return new RTestResult(true);
  }

  visitCheckWithinNode(node: CheckWithinNode, [env, ..._]: [Environment, never[]]): RValue {
    node.used = true;
    if (isRFalse(node.arg.accept(this, env))) {
      return new RTestResult(
        false,
        CE_NOT_WITHIN_ERR(
          node.actualNode.accept(this, env).stringify(),
          node.expectedNode.accept(this, env).stringify(),
          node.withinNode.accept(this, env).stringify()
        ),
        node.sourceSpan
      );
    }
    return new RTestResult(true);
  }

  visitCondNode(node: CondNode, [env, ..._]: [Environment, never[]]): RValue {
    node.used = true;
    for (const [question, answer] of node.questionAnswerClauses) {
      const questionResult = question.accept(this, env);
      if (!isRBoolean(questionResult)) {
        throw new StageError(
          WF_QUESTION_NOT_BOOL_ERR(Keyword.Cond, questionResult.stringify()),
          node.sourceSpan
        );
      }
      if (questionResult === R_TRUE) { return answer.accept(this, env); }
    }
    throw new StageError(
      CN_ALL_QUESTION_RESULTS_FALSE_ERR,
      node.sourceSpan
    );
  }

  visitDefnStructNode(node: DefnStructNode, [env, ..._]: [Environment, never[]]): RValue {
    node.used = true;
    env.set(node.nameLabel, new RStructType(node.name));
    env.set(node.makeStructLabel, new RMakeStructFun(node.name, node.fields.length));
    env.set(node.structHuhLabel, new RStructHuhProc(node.name));
    node.fields.forEach((field, idx) => {
      env.set(node.fieldLabels[idx], new RStructGetProc(node.name, field, idx));
    });
    return R_VOID;
  }

  visitDefnVarNode(node: DefnVarNode, [env, ..._]: [Environment, never[]]): RValue {
    node.used = true;
    env.set(node.nameLabel, node.value.accept(this, env));
    return R_VOID;
  }

  visitEllipsisProcAppNode(node: EllipsisProcAppNode): RValue {
    throw new StageError(
      EL_EXPECTED_FINISHED_EXPR_ERR(node.placeholder.token.text),
      node.sourceSpan
    );
  }

  visitEllipsisNode(node: EllipsisNode): RValue {
    throw new StageError(
      EL_EXPECTED_FINISHED_EXPR_ERR(node.placeholder.token.text),
      node.sourceSpan
    );
  }

  visitIfNode(node: IfNode, [env, ..._]: [Environment, never[]]): RValue {
    node.used = true;
    const questionResult = node.question.accept(this, env);
    if (!isRBoolean(questionResult)) {
      throw new StageError(
        WF_QUESTION_NOT_BOOL_ERR(Keyword.If, questionResult.stringify()),
        node.sourceSpan
      );
    }
    if (isRTrue(questionResult)) {
      return node.trueAnswer.accept(this, env);
    } else {
      return node.falseAnswer.accept(this, env);
    }
  }

  visitLambdaNode(node: LambdaNode, [env, ..._]: [Environment, never[]]): RValue {
    node.used = true;
    return new RLambda(node.name, new Environment(env), node.params, node.paramLabels, node.body);
  }

  visitLetNode(node: LetNode, [env, ..._]: [Environment, never[]]): RValue {
    node.used = true;
    node.bindings.forEach(([variable, _]) => {
      variable.used = true;
    });
    switch (node.name) {
      case "letrec":
      case "let*":
      case "let": {
        node.bindings.forEach(([variable, expr]) => {
          env.set(variable.label, expr.accept(this, env));
        });
        return node.body.accept(this, env);
      }
      default: {
        throw "illegal state: unsupported let-style expression";
      }
    }
  }

  visitLocalNode(node: LocalNode, [env, ..._]: [Environment, never[]]): RValue {
    node.used = true;
    node.defns.forEach(defn => defn.accept(this, env));
    return node.body.accept(this, env);
  }

  visitOrNode(node: OrNode, [env, ..._]: [Environment, never[]]): RValue {
    node.used = true;
    let result: RValue = R_TRUE;
    for (const arg of node.args) {
      result = arg.accept(this, env);
      if (result !== R_FALSE) { break; }
    }
    if (!isRBoolean(result)) {
      throw new StageError(
        WF_QUESTION_NOT_BOOL_ERR(Keyword.Or, result.stringify()),
        node.sourceSpan
      );
    }
    return result;
  }

  visitProcAppNode(node: ProcAppNode, [env, ..._]: [Environment, never[]]): RValue {
    node.used = true;
    let rval: RValue;
    if (isVarNode(node.fn)) {
      rval = env.get(
        node.fn.name,
        node.fn.label,
        node.fn.sourceSpan
      );
      if (!isRProcedure(rval)) {
        throw new StageError(
          FC_EXPECTED_FUNCTION_ERR(
            isRStructType(rval)
              ? `a structure type (do you mean make-${rval.name})`
              : "a variable"
          ),
          node.fn.sourceSpan
        );
      }
    } else {
      rval = node.fn.accept(this, env);
    }
    if (isRProcedure(rval)) {
      try {
        return rval.accept(new EvaluateRProcedureVisitor(
          node.args,
          new Environment(env),
          node.sourceSpan
        ));
      } catch (e) {
        if (e instanceof UserError) {
          throw new StageError(
            e.message,
            node.sourceSpan
          );
        } else {
          throw e;
        }
      }
    } else {
      throw new StageError(
        FC_EXPECTED_FUNCTION_ERR(
          isRStructType(rval)
            ? `a structure type (do you mean make-${rval.name})`
            : rval.stringify()
        ),
        node.fn.sourceSpan
      );
    }
  }

  visitRequireNode(node: RequireNode, [env, ..._]: [Environment, never[]]): RValue {
    node.used = true;
    /* eslint-disable @typescript-eslint/no-non-null-assertion */
    const module = node.global.modules.get(node.name)!;
    for (const procedure of module.procedures) {
      if (!env.has(procedure.getName())) {
        env.set(procedure.getName(), procedure);
      }
    }
    for (const [name, rval] of module.data) {
      if (!env.has(name)) {
        env.set(name, rval);
      }
    }
    return R_VOID;
  }

  visitVarNode(node: VarNode, [env, ..._]: [Environment, never[]]): RValue {
    node.used = true;
    return env.get(
      node.name,
      node.label,
      node.sourceSpan
    );
  }
}


class EvaluateRProcedureVisitor implements RProcedureVisitor<RValue> {
  evaluator: EvaluateCode;

  constructor(
    readonly args: ASTNode[],
    readonly env: Environment,
    readonly sourceSpan: SourceSpan
  ) {
    this.evaluator = new EvaluateCode();
  }

  visitRComposedProcedure(rval: RComposedProcedure): RValue {
    let result = rval.procedures[0].accept(this);
    for (const procedure of rval.procedures.slice(1)) {
      result = procedure.accept(new EvaluateRProcedureVisitor(
        [new AtomNode(result, this.sourceSpan)],
        this.env,
        this.sourceSpan
      ));
    }
    return result;
  }

  visitRStructHuhProc(rval: RStructHuhProc): RValue {
    if (this.args.length !== 1) {
      throw new StageError(
        FA_ARITY_ERR(`${rval.name}?`, 1, this.args.length),
        this.sourceSpan
      );
    }
    const argVal = this.args[0].accept(this.evaluator, this.env);
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
    return new RStruct(rval.name, this.args.map(node => node.accept(this.evaluator, this.env)));
  }

  visitRLambda(rval: RLambda): RValue {
    if (rval.params.length !== this.args.length) {
      throw new StageError(
        FA_ARITY_ERR(rval.getName(), rval.params.length, this.args.length),
        this.sourceSpan
      );
    }
    const closureCopy = rval.closure.copy();
    closureCopy.parentEnv = this.env;
    const paramEnv = new Environment(closureCopy);
    for (let idx = 0; idx < this.args.length; idx++) {
      paramEnv.set(rval.paramLabels[idx], this.args[idx].accept(this.evaluator, this.env));
    }
    return rval.body.accept(this.evaluator, paramEnv);
  }

  visitRPrimProc(rval: RPrimProc): RValue {
    const argsLength = this.args.length;
    if (rval.config.minArityWithoutLists !== undefined) {
      if (argsLength <= rval.config.minArityWithoutLists) {
        throw new StageError(
          HO_EXPECTED_LIST_ARGUMENT_ERR(rval.name),
          this.sourceSpan
        );
      }
    } else if (
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
    const argVals = this.args.map(arg => arg.accept(this.evaluator, this.env));
    for (const [idx, paramType] of funType.paramTypes.entries()) {
      const argVal = argVals[idx];
      if (paramType.isCompatibleWith(argVal, rval.name, this.sourceSpan)) {
        continue;
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

  visitRStructGetProc(rval: RStructGetProc): RValue {
    if (this.args.length !== 1) {
      throw new StageError(
        FA_ARITY_ERR(`${rval.name}-${rval.fieldName}`, 1, this.args.length),
        this.sourceSpan
      );
    }
    const argVal = this.args[0].accept(this.evaluator, this.env);
    if (!(argVal instanceof RStruct) || argVal.name != rval.name) {
      throw new StageError(
        FA_WRONG_TYPE_ERR(`${rval.name}-${rval.fieldName}`, rval.name, argVal.stringify()),
        this.sourceSpan
      );
    }
    return argVal.vals[rval.idx];
  }
}
