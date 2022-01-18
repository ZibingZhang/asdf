import {
  AnyProcedureType,
  AnyType,
  BooleanType,
  ExactNonNegativeIntegerType,
  ListType,
  ProcedureType,
  RealType,
  Type,
  isProcedureType
} from "../types";
import {
  AtomNode,
  EvaluateRProcedureVisitor
} from "../ast";
import {
  HO_CONTRACT_VIOLATION_ERR,
  HO_EXPECTED_BOOLEAN_ERR,
  HO_EXPECTED_LISTS_SAME_LENGTH_ERR
} from "../error";
import {
  RList,
  RMath,
  RNumber,
  RPrimFun,
  RProcedure,
  RValue,
  R_FALSE,
  isRBoolean,
  isRFalse,
  isRProcedure,
  isRTrue,
  toRBoolean,
  R_TRUE,
  RLambda
} from "../rvalue";
import {
  Environment
} from "../environment";
import {
  SourceSpan
} from "../sourcespan";
import {
  StageError
} from "../pipeline";

export {
  RPFAndmap,
  RPFApply,
  RPFArgmax,
  RPFArgmin,
  RPFBuildList,
  RPFFilter,
  RPFFoldl,
  RPFFoldr,
  RPFMap,
  RPFMemf,
  RPFOrmap,
  RPFProcedureHuh,
  RPFSort
};

abstract class RHigherOrderPrimFun extends RPrimFun {
  assertBooleanType(receivedVal: RValue, procedure: RProcedure, sourceSpan: SourceSpan) {
    if (!isRBoolean(receivedVal)) {
      throw new StageError(
        HO_EXPECTED_BOOLEAN_ERR(this.name, procedure.stringify(), receivedVal.stringify()),
        sourceSpan
      );
    }
  }

  assertCorrectType(expectedType: Type, receivedVal: RValue, sourceSpan: SourceSpan) {
    let receivedType;
    if (isProcedureType(expectedType)) {
      receivedType = receivedVal.getType(expectedType.paramTypes.length);
      if (expectedType.isCompatibleWith(receivedType)) {
        return;
      }
    } else if (!isRProcedure(receivedVal)) {
      if (expectedType.isSuperTypeOf(receivedVal.getType())) {
        return;
      }
    }
    throw new StageError(
      HO_CONTRACT_VIOLATION_ERR(this.name, expectedType.stringify(), receivedVal.stringify()),
      sourceSpan
    );
  }

  assertListsLength(lists: RList[], procedure: RProcedure, sourceSpan: SourceSpan) {
    const initLength = lists[0].vals.length;
    for (const list of lists.slice(1)) {
      if (list.vals.length !== initLength) {
        throw new StageError(
          HO_EXPECTED_LISTS_SAME_LENGTH_ERR(this.name, initLength, list.vals.length, procedure.stringify()),
          sourceSpan
        );
      }
    }
  }
}

class RPFAndmap extends RHigherOrderPrimFun {
  constructor() {
    super("andmap", { minArityWithoutLists: 1 });
  }

  getType(args: number): ProcedureType {
    return new ProcedureType([new ProcedureType(new Array(args - 1).fill(new AnyType()), new BooleanType()), ...new Array(args - 1).fill(new ListType())], new ListType());
  }

  call(args: RValue[], sourceSpan: SourceSpan, env: Environment): RValue {
    const procedure = <RProcedure>args[0];
    const lists = <RList[]>args.slice(1);
    this.assertListsLength(lists, procedure, sourceSpan);
    for (let idx = 0; idx < lists[0].vals.length; idx++) {
      const val = procedure.accept(
        new EvaluateRProcedureVisitor(lists.map(list =>
          new AtomNode(list.vals[idx], sourceSpan)
        ), env, sourceSpan)
      );
      this.assertBooleanType(val, procedure, sourceSpan);
      if (isRFalse(val)) {
        return R_FALSE;
      }
    }
    return R_TRUE;
  }
}

class RPFApply extends RHigherOrderPrimFun {
  constructor() {
    super("apply");
  }

  getType(args: number): ProcedureType {
    return new ProcedureType([new AnyProcedureType()].concat(new Array(args - 2).fill(new AnyType).concat(new ListType())), new AnyType());
  }

  call(args: RValue[], sourceSpan: SourceSpan, env: Environment): RValue {
    const callable = <RProcedure>args[0];
    const argument$ = args.slice(1, -1).concat(...(<RList>args[args.length - 1]).vals);
    return callable.accept(
      new EvaluateRProcedureVisitor(
        argument$.map(argument => new AtomNode(argument, sourceSpan)),
        env,
        sourceSpan
      )
    );
  }
}

class RPFArgmax extends RHigherOrderPrimFun {
  constructor() {
    super("argmax");
  }

  getType(): ProcedureType {
    return new ProcedureType([new ProcedureType([new AnyType()], new RealType()), new ListType(1)], new AnyType());
  }

  call(args: RValue[], sourceSpan: SourceSpan, env: Environment): RValue {
    const callable = <RProcedure>args[0];
    const list = <RList>args[1];
    let maxElement = list.vals[0];
    let max = <RNumber>callable.accept(
      new EvaluateRProcedureVisitor([
        new AtomNode(maxElement, sourceSpan)
      ], env, sourceSpan)
    );
    this.assertCorrectType(new RealType(), max, sourceSpan);
    for (const val of list.vals.slice(1)) {
      const appliedVal = <RNumber>callable.accept(
        new EvaluateRProcedureVisitor([
          new AtomNode(val, sourceSpan)
        ], env, sourceSpan));
      this.assertCorrectType(new RealType(), appliedVal, sourceSpan);
      if (appliedVal.toDecimal() > max.toDecimal()) {
        maxElement = val;
        max = appliedVal;
      }
    }
    return maxElement;
  }
}

class RPFArgmin extends RHigherOrderPrimFun {
  constructor() {
    super("argmin");
  }

  getType(): ProcedureType {
    return new ProcedureType([new ProcedureType([new AnyType()], new RealType()), new ListType(1)], new AnyType());
  }

  call(args: RValue[], sourceSpan: SourceSpan, env: Environment): RValue {
    const callable = <RProcedure>args[0];
    const list = <RList>args[1];
    let minElement = list.vals[0];
    let min = <RNumber>callable.accept(
      new EvaluateRProcedureVisitor([
        new AtomNode(minElement, sourceSpan)
      ], env, sourceSpan)
    );
    this.assertCorrectType(new RealType(), min, sourceSpan);
    for (const val of list.vals.slice(1)) {
      const appliedVal = <RNumber>callable.accept(
        new EvaluateRProcedureVisitor([
          new AtomNode(val, sourceSpan)
        ], env, sourceSpan));
      this.assertCorrectType(new RealType(), appliedVal, sourceSpan);
      if (appliedVal.toDecimal() > min.toDecimal()) {
        minElement = val;
        min = appliedVal;
      }
    }
    return minElement;
  }
}

class RPFBuildList extends RHigherOrderPrimFun {
  constructor() {
    super("build-list");
  }

  getType(): ProcedureType {
    return new ProcedureType([new ExactNonNegativeIntegerType(), new ProcedureType([new ExactNonNegativeIntegerType()], new AnyType())], new ListType());
  }

  call(args: RValue[], sourceSpan: SourceSpan, env: Environment): RValue {
    const callable = <RProcedure>args[1];
    const listVals: RValue[] = [];
    for (let idx = 0n; idx < (<RNumber>args[0]).numerator; idx++) {
      const evaluator = new EvaluateRProcedureVisitor([
        new AtomNode(RMath.make(true, idx), sourceSpan)
      ], env, sourceSpan);
      listVals.push(callable.accept(evaluator));
    }
    return new RList(listVals);
  }
}

class RPFFilter extends RHigherOrderPrimFun {
  constructor() {
    super("filter");
  }

  getType(): ProcedureType {
    return new ProcedureType([new ProcedureType([new AnyType()], new BooleanType()), new ListType()], new ListType());
  }

  call(args: RValue[], sourceSpan: SourceSpan, env: Environment): RValue {
    const predicate = <RProcedure>args[0];
    const list = <RList>args[1];
    const filteredVals: RValue[] = [];
    for (const val of list.vals) {
      const stayInList = predicate.accept(
        new EvaluateRProcedureVisitor([
          new AtomNode(val, sourceSpan)
        ], env, sourceSpan)
      );
      this.assertBooleanType(stayInList, predicate, sourceSpan);
      if (isRTrue(stayInList)) {
        filteredVals.push(val);
      }
    }
    return new RList(filteredVals);
  }
}

class RPFFoldl extends RHigherOrderPrimFun {
  constructor() {
    super("foldl", { minArityWithoutLists: 2 });
  }

  getType(args: number): ProcedureType {
    return new ProcedureType([new ProcedureType(new Array(args - 1).fill(new AnyType()), new AnyType()), new AnyType(), ...new Array(args - 2).fill(new ListType())], new AnyType());
  }

  call(args: RValue[], sourceSpan: SourceSpan, env: Environment): RValue {
    const procedure = <RProcedure>args[0];
    const base = <RValue>args[1];
    const lists = <RList[]>args.slice(2);
    this.assertListsLength(lists, procedure, sourceSpan);
    let result = base;
    for (let idx = 0; idx < lists[0].vals.length; idx++) {
      result = procedure.accept(
        new EvaluateRProcedureVisitor(lists.map(list =>
          new AtomNode(list.vals[idx], sourceSpan)
        ).concat([new AtomNode(result, sourceSpan)]), env, sourceSpan)
      );
    }
    return result;
  }
}

class RPFFoldr extends RHigherOrderPrimFun {
  constructor() {
    super("foldr", { minArityWithoutLists: 2 });
  }

  getType(args: number): ProcedureType {
    return new ProcedureType([new ProcedureType(new Array(args - 1).fill(new AnyType()), new AnyType()), new AnyType(), ...new Array(args - 2).fill(new ListType())], new AnyType());
  }

  call(args: RValue[], sourceSpan: SourceSpan, env: Environment): RValue {
    const procedure = <RProcedure>args[0];
    const base = <RValue>args[1];
    const lists = <RList[]>args.slice(2);
    this.assertListsLength(lists, procedure, sourceSpan);
    let result = base;
    for (let idx = lists[0].vals.length - 1; idx >= 0; idx--) {
      result = procedure.accept(
        new EvaluateRProcedureVisitor(lists.map(list =>
          new AtomNode(list.vals[idx], sourceSpan)
        ).concat([new AtomNode(result, sourceSpan)]), env, sourceSpan)
      );
    }
    return result;
  }
}

class RPFMap extends RHigherOrderPrimFun {
  constructor() {
    super("map", { minArityWithoutLists: 1 });
  }

  getType(args: number): ProcedureType {
    return new ProcedureType([new ProcedureType(new Array(args - 1).fill(new AnyType()), new AnyType()), ...new Array(args - 1).fill(new ListType())], new ListType());
  }

  call(args: RValue[], sourceSpan: SourceSpan, env: Environment): RValue {
    const procedure = <RProcedure>args[0];
    const lists = <RList[]>args.slice(1);
    this.assertListsLength(lists, procedure, sourceSpan);
    const mappedVals: RValue[] = [];
    for (let idx = 0; idx < lists[0].vals.length; idx++) {
      mappedVals.push(procedure.accept(
        new EvaluateRProcedureVisitor(lists.map(list =>
          new AtomNode(list.vals[idx], sourceSpan)
        ), env, sourceSpan)
      ));
    }
    return new RList(mappedVals);
  }
}

class RPFMemf extends RHigherOrderPrimFun {
  constructor() {
    super("memf");
  }

  getType(): ProcedureType {
    // output type should be (union #false (listof X)), which is currently unsupported
    return new ProcedureType([new ProcedureType([new AnyType()], new AnyType()), new ListType()], new AnyType());
  }

  call(args: RValue[], sourceSpan: SourceSpan, env: Environment): RValue {
    const predicate = <RProcedure>args[0];
    const list = <RList>args[1];
    for (const [idx, val] of list.vals.entries()) {
      const shortCircuitEvaluation = predicate.accept(
        new EvaluateRProcedureVisitor([
          new AtomNode(val, sourceSpan)
        ], env, sourceSpan)
      );
      if (!isRFalse(shortCircuitEvaluation)) {
        return new RList(list.vals.slice(idx));
      }
    }
    return R_FALSE;
  }
}

class RPFOrmap extends RHigherOrderPrimFun {
  constructor() {
    super("ormap", { minArityWithoutLists: 1 });
  }

  getType(args: number): ProcedureType {
    return new ProcedureType([new ProcedureType(new Array(args - 1).fill(new AnyType()), new BooleanType()), ...new Array(args - 1).fill(new ListType())], new ListType());
  }

  call(args: RValue[], sourceSpan: SourceSpan, env: Environment): RValue {
    const procedure = <RProcedure>args[0];
    const lists = <RList[]>args.slice(1);
    this.assertListsLength(lists, procedure, sourceSpan);
    for (let idx = 0; idx < lists[0].vals.length; idx++) {
      const val = procedure.accept(
        new EvaluateRProcedureVisitor(lists.map(list =>
          new AtomNode(list.vals[idx], sourceSpan)
        ), env, sourceSpan)
      );
      this.assertBooleanType(val, procedure, sourceSpan);
      if (isRTrue(val)) {
        return R_TRUE;
      }
    }
    return R_FALSE;
  }
}

class RPFProcedureHuh extends RPrimFun {
  constructor() {
    super("procedure?");
  }

  getType(): ProcedureType {
    return new ProcedureType([new AnyType()], new BooleanType());
  }

  call(args: RValue[]): RValue {
    return toRBoolean(isRProcedure(args[0]));
  }
}

class RPFSort extends RHigherOrderPrimFun {
  constructor() {
    super("sort");
  }

  getType(): ProcedureType {
    return new ProcedureType([new ListType(), new ProcedureType([new AnyType(), new AnyType()], new BooleanType())], new ListType());
  }

  call(args: RValue[], sourceSpan: SourceSpan, env: Environment): RValue {
    const list = <RList>args[0];
    const comparison = <RProcedure>args[1];
    return new RList(list.vals.sort((a: RValue, b: RValue) => {
      const shouldSwap = comparison.accept(
        new EvaluateRProcedureVisitor([
          new AtomNode(a, sourceSpan),
          new AtomNode(b, sourceSpan)
        ], env, sourceSpan)
      );
      this.assertBooleanType(shouldSwap, comparison, sourceSpan);
      return isRTrue(shouldSwap) ? -1 : 1;
    }));
  }
}
