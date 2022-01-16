import {
  RCallable,
  RList,
  RMath,
  RNumber,
  RPrimFun,
  RValue,
  TypeName
} from "../rvalue";
import {
  NO_SOURCE_SPAN,
  SourceSpan
} from "../sourcespan";
import {
  Environment
} from "../environment";
import {
  AtomNode,
  EvaluateRCallableVisitor
} from "../ast";

export {
  RPFBuildList
};

class RPFBuildList extends RPrimFun {
  constructor() {
    super("build-list", { arity: 2, argsTypeNames: [TypeName.ExactNonNegativeInteger, TypeName.ExactNonNegativeIntegerToAny] });
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
}
