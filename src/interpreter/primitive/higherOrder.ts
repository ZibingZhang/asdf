import {
  AnyProcedureType,
  AnyType,
  BooleanType,
  ExactNonNegativeIntegerType,
  ListType,
  OrType,
  ProcedureType,
  RealType,
  Type,
  isProcedureType
} from "../values/types";
import {
  HO_CONTRACT_VIOLATION_ERR,
  HO_EXPECTED_BOOLEAN_ERR,
  HO_EXPECTED_LISTS_SAME_LENGTH_ERR
} from "../error";
import {
  RBoolean,
  RComposedProcedure,
  RList,
  RMath,
  RNumber,
  RPrimProc,
  RProcedure,
  RValue,
  R_FALSE,
  R_TRUE,
  isRBoolean,
  isRFalse,
  isRProcedure,
  isRTrue,
  toRBoolean
} from "../values/rvalue";
import {
  AtomNode
} from "../ir/ast";
import {
  Environment
} from "../data/environment";
import {
  EvaluateRProcedureVisitor
} from "../pipeline/evaluate";
import {
  SourceSpan
} from "../data/sourcespan";
import {
  StageError
} from "../data/stage";

export {
  RPPAndmap,
  RPPApply,
  RPPArgmax,
  RPPArgmin,
  RPPBuildList,
  RPPCompose,
  RPPFilter,
  RPPFoldl,
  RPPFoldr,
  RPPMap,
  RPPMemf,
  RPPOrmap,
  RPPProcedureHuh,
  RPPSort
};

abstract class RHigherOrdeRPrimProc extends RPrimProc {
  assertBooleanType(receivedVal: RValue, procedure: RProcedure, sourceSpan: SourceSpan) {
    if (!isRBoolean(receivedVal)) {
      throw new StageError(
        HO_EXPECTED_BOOLEAN_ERR(super.name, procedure.stringify(), receivedVal.stringify()),
        sourceSpan
      );
    }
  }

  assertCorrectType(expectedType: Type, receivedVal: RValue, sourceSpan: SourceSpan) {
    if (isProcedureType(expectedType)) {
      if (expectedType.isCompatibleWith(receivedVal)) {
        return;
      }
    } else if (!isRProcedure(receivedVal)) {
      if (expectedType.isSuperTypeOf(receivedVal.getType(-1), receivedVal)) {
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

class RPPAndmap extends RHigherOrdeRPrimProc {
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

class RPPApply extends RHigherOrdeRPrimProc {
  constructor() {
    super("apply", { minArity: 2 });
  }

  getType(args: number): ProcedureType {
    return new ProcedureType([new AnyProcedureType()].concat(new Array(args - 2).fill(new AnyType).concat(new ListType())), new AnyType());
  }

  call(args: RValue[], sourceSpan: SourceSpan, env: Environment): RValue {
    const procedure = <RProcedure>args[0];
    const argument$ = args.slice(1, -1).concat(...(<RList>args[args.length - 1]).vals);
    return procedure.accept(
      new EvaluateRProcedureVisitor(
        argument$.map(argument => new AtomNode(argument, sourceSpan)),
        env,
        sourceSpan
      )
    );
  }
}

class RPPArgmax extends RHigherOrdeRPrimProc {
  constructor() {
    super("argmax");
  }

  getType(): ProcedureType {
    return new ProcedureType([new ProcedureType([new AnyType()], new RealType()), new ListType(1)], new AnyType());
  }

  call(args: RValue[], sourceSpan: SourceSpan, env: Environment): RValue {
    const procedure = <RProcedure>args[0];
    const list = <RList>args[1];
    let maxElement = list.vals[0];
    let max = <RNumber>procedure.accept(
      new EvaluateRProcedureVisitor([
        new AtomNode(maxElement, sourceSpan)
      ], env, sourceSpan)
    );
    this.assertCorrectType(new RealType(), max, sourceSpan);
    for (const val of list.vals.slice(1)) {
      const appliedVal = <RNumber>procedure.accept(
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

class RPPArgmin extends RHigherOrdeRPrimProc {
  constructor() {
    super("argmin");
  }

  getType(): ProcedureType {
    return new ProcedureType([new ProcedureType([new AnyType()], new RealType()), new ListType(1)], new AnyType());
  }

  call(args: RValue[], sourceSpan: SourceSpan, env: Environment): RValue {
    const procedure = <RProcedure>args[0];
    const list = <RList>args[1];
    let minElement = list.vals[0];
    let min = <RNumber>procedure.accept(
      new EvaluateRProcedureVisitor([
        new AtomNode(minElement, sourceSpan)
      ], env, sourceSpan)
    );
    this.assertCorrectType(new RealType(), min, sourceSpan);
    for (const val of list.vals.slice(1)) {
      const appliedVal = <RNumber>procedure.accept(
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

class RPPBuildList extends RHigherOrdeRPrimProc {
  constructor() {
    super("build-list");
  }

  getType(): ProcedureType {
    return new ProcedureType([new ExactNonNegativeIntegerType(), new ProcedureType([new ExactNonNegativeIntegerType()], new AnyType())], new ListType());
  }

  call(args: RValue[], sourceSpan: SourceSpan, env: Environment): RValue {
    const procedure = <RProcedure>args[1];
    const listVals: RValue[] = [];
    for (let idx = 0n; idx < (<RNumber>args[0]).numerator; idx++) {
      const evaluator = new EvaluateRProcedureVisitor([
        new AtomNode(RMath.make(true, idx), sourceSpan)
      ], env, sourceSpan);
      listVals.push(procedure.accept(evaluator));
    }
    return new RList(listVals);
  }
}

class RPPCompose extends RHigherOrdeRPrimProc {
  constructor() {
    super("compose");
  }

  getType(args: number): ProcedureType {
    return new ProcedureType(new Array(Math.max(1, args)).fill(new AnyProcedureType()), new AnyProcedureType());
  }

  call(args: RValue[], _: SourceSpan, __: Environment): RValue {
    if (args.length === 1) {
      return args[0];
    } else {
      return new RComposedProcedure(...<RProcedure[]>args.reverse());
    }
  }
}

class RPPFilter extends RHigherOrdeRPrimProc {
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

class RPPFoldl extends RHigherOrdeRPrimProc {
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

class RPPFoldr extends RHigherOrdeRPrimProc {
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

class RPPMap extends RHigherOrdeRPrimProc {
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

class RPPMemf extends RHigherOrdeRPrimProc {
  constructor() {
    super("memf");
  }

  getType(): ProcedureType {
    return new ProcedureType([new ProcedureType([new AnyType()], new AnyType()), new ListType()], new OrType([new ListType()], [new RBoolean(false)]));
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

class RPPOrmap extends RHigherOrdeRPrimProc {
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

class RPPProcedureHuh extends RPrimProc {
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

class RPPSort extends RHigherOrdeRPrimProc {
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
