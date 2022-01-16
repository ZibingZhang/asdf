import {
  AnyType,
  ExactNonNegativeIntegerType,
  FunctionType,
  ListType
} from "../types";
import {
  AtomNode,
  EvaluateRCallableVisitor
} from "../ast";
import {
  NO_SOURCE_SPAN,
  SourceSpan
} from "../sourcespan";
import {
  RCallable,
  RList,
  RMath,
  RNumber,
  RPrimFun,
  RValue
} from "../rvalue";
import {
  Environment
} from "../environment";

export {
  RPFBuildList
};

class RPFBuildList extends RPrimFun {
  constructor() {
    super("build-list");
  }

  call(args: RValue[], _: SourceSpan, env: Environment): RValue {
    const callable = <RCallable>args[1];
    const listVals: RValue[] = [];
    for (let idx = 0n; idx < (<RNumber>args[0]).numerator; idx++) {
      const evaluator = new EvaluateRCallableVisitor([
        new AtomNode(RMath.make(true, idx), NO_SOURCE_SPAN)
      ], env, NO_SOURCE_SPAN);
      listVals.push(callable.accept(evaluator));
    }
    return new RList(listVals);
  }

  getType(): FunctionType {
    return new FunctionType([new ExactNonNegativeIntegerType(), new FunctionType([new ExactNonNegativeIntegerType()], new AnyType())], new ListType());
  }
}
