import {
  RList,
  RPrimFun,
  RValue,
  R_EMPTY_LIST,
  TypeName,
  isRData,
  isREmptyList,
  isRList,
  toRBoolean,
  RMath,
  RNumber
} from "../rvalue";

export {
  RPFAppend,
  RPFCar,
  RPFCdr,
  RPFCons,
  RPFEighth,
  RPFEmptyHuh,
  RPFFifth,
  RPFFirst,
  RPFFourth,
  RPFLength,
  RPFList,
  RPFListStar,
  RPFListHuh,
  RPFMakeList,
  RPFMember,
  R_NULL,
  RPFRemove,
  RPFRemoveAll,
  RPFRest,
  RPFReverse,
  RPFSecond,
  RPFSeventh,
  RPFSixth,
  RPFThird
};

const R_NULL = R_EMPTY_LIST;

class RPFAppend extends RPrimFun {
  constructor() {
    super("append", { minArity: 2, allArgsTypeName: TypeName.LIST });
  }

  call(args: RValue[]): RValue {
    return new RList(args.flatMap(arg => (<RList>arg).vals));
  }
}

class RPFCar extends RPrimFun {
  constructor() {
    super("car", { arity: 1, onlyArgTypeName: TypeName.PAIR });
  }

  call(args: RValue[]): RValue {
    return (<RList>args[0]).vals[0];
  }
}

class RPFCdr extends RPrimFun {
  constructor() {
    super("cdr", { arity: 1, onlyArgTypeName: TypeName.PAIR });
  }

  call(args: RValue[]): RValue {
    return new RList((<RList>args[0]).vals.slice(1));
  }
}

class RPFCons extends RPrimFun {
  constructor() {
    super("cons", { arity: 2, argsTypeNames: [TypeName.ANY, TypeName.LIST] });
  }

  call(args: RValue[]): RValue {
    return new RList([args[0], ...(<RList>args[1]).vals]);
  }
}

class RPFEighth extends RPrimFun {
  constructor() {
    super("eighth", { arity: 1, onlyArgTypeName: TypeName.N_LIST_8 });
  }

  call(args: RValue[]): RValue {
    return (<RList>args[0]).vals[7];
  }
}

class RPFEmptyHuh extends RPrimFun {
  constructor(alias?: string) {
    super(alias || "empty?", { arity: 1 });
  }

  call(args: RValue[]): RValue {
    return toRBoolean(isREmptyList(args[0]));
  }
}

class RPFFifth extends RPrimFun {
  constructor() {
    super("fifth", { arity: 1, onlyArgTypeName: TypeName.N_LIST_5 });
  }

  call(args: RValue[]): RValue {
    return (<RList>args[0]).vals[4];
  }
}

class RPFFirst extends RPrimFun {
  constructor() {
    super("first", { arity: 1, onlyArgTypeName: TypeName.NON_EMPTY_LIST });
  }

  call(args: RValue[]): RValue {
    return (<RList>args[0]).vals[0];
  }
}

class RPFFourth extends RPrimFun {
  constructor() {
    super("fourth", { arity: 1, onlyArgTypeName: TypeName.N_LIST_4 });
  }

  call(args: RValue[]): RValue {
    return (<RList>args[0]).vals[3];
  }
}

class RPFLength extends RPrimFun {
  constructor() {
    super("length", { arity: 1, onlyArgTypeName: TypeName.LIST });
  }

  call(args: RValue[]): RValue {
    return RMath.make(true, BigInt((<RList>args[0]).vals.length));
  }
}

class RPFList extends RPrimFun {
  constructor() {
    super("list", {});
  }

  call(args: RValue[]): RValue {
    return new RList(args);
  }
}

class RPFListStar extends RPrimFun {
  constructor() {
    super("list*", { lastArgTypeName: TypeName.LIST });
  }

  call(args: RValue[]): RValue {
    return new RList(args.slice(0, -1).concat((<RList>args[args.length - 1]).vals));
  }
}

class RPFListHuh extends RPrimFun {
  constructor(alias?: string) {
    super(alias || "list?", { arity: 1 });
  }

  call(args: RValue[]): RValue {
    return toRBoolean(isRList(args[0]));
  }
}

class RPFMakeList extends RPrimFun {
  constructor() {
    super("make-list", { arity: 2, argsTypeNames: [TypeName.EXACT_NON_NEGATIVE_INTEGER, TypeName.ANY] });
  }

  call(args: RValue[]): RValue {
    return new RList(new Array(Number((<RNumber>args[0]).numerator)).fill(args[1]));
  }
}

class RPFMember extends RPrimFun {
  constructor(alias?: string) {
    super(alias || "member", { argsTypeNames: [TypeName.ANY, TypeName.LIST] });
  }

  call(args: RValue[]): RValue {
    const testVal = args[0];
    return toRBoolean(isRData(testVal) && (<RList>args[1]).vals.some((val) => testVal.equal(val)));
  }
}

class RPFRemove extends RPrimFun {
  constructor() {
    super("remove", { argsTypeNames: [TypeName.ANY, TypeName.LIST] });
  }

  call(args: RValue[]): RValue {
    const testVal = args[0];
    const listVals = (<RList>args[1]).vals;
    if (isRData(testVal)) {
      for (const [idx, val] of listVals.entries()) {
        if (testVal.equal(val)) {
          return new RList(listVals.slice(0, idx).concat(listVals.slice(idx + 1)));
        }
      }
      return args[1];
    } else {
      return args[1];
    }
  }
}

class RPFRemoveAll extends RPrimFun {
  constructor() {
    super("remove-all", { argsTypeNames: [TypeName.ANY, TypeName.LIST] });
  }

  call(args: RValue[]): RValue {
    const testVal = args[0];
    if (isRData(testVal)) {
      return new RList((<RList>args[1]).vals.filter((val) => !testVal.equal(val)));
    } else {
      return args[1];
    }
  }
}

class RPFRest extends RPrimFun {
  constructor() {
    super("rest", { arity: 1, onlyArgTypeName: TypeName.NON_EMPTY_LIST });
  }

  call(args: RValue[]): RValue {
    return new RList((<RList>args[0]).vals.slice(1));
  }
}

class RPFReverse extends RPrimFun {
  constructor() {
    super("reverse", { arity: 1, onlyArgTypeName: TypeName.LIST });
  }

  call(args: RValue[]): RValue {
    return new RList((<RList>args[0]).vals.reverse());
  }
}

class RPFSecond extends RPrimFun {
  constructor() {
    super("second", { arity: 1, onlyArgTypeName: TypeName.N_LIST_2 });
  }

  call(args: RValue[]): RValue {
    return (<RList>args[0]).vals[1];
  }
}

class RPFSeventh extends RPrimFun {
  constructor() {
    super("seventh", { arity: 1, onlyArgTypeName: TypeName.N_LIST_7 });
  }

  call(args: RValue[]): RValue {
    return (<RList>args[0]).vals[6];
  }
}

class RPFSixth extends RPrimFun {
  constructor() {
    super("sixth", { arity: 1, onlyArgTypeName: TypeName.N_LIST_6 });
  }

  call(args: RValue[]): RValue {
    return (<RList>args[0]).vals[5];
  }
}

class RPFThird extends RPrimFun {
  constructor() {
    super("third", { arity: 1, onlyArgTypeName: TypeName.N_LIST_3 });
  }

  call(args: RValue[]): RValue {
    return (<RList>args[0]).vals[2];
  }
}
