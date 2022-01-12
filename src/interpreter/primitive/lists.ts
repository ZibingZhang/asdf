import {
  RList,
  RPrimFun,
  RValue,
  R_EMPTY_LIST,
  TypeName,
  isRData,
  isREmptyList,
  isRList,
  toRBoolean
} from "../rvalue";

export {
  RPFAppend,
  RPFCar,
  RPFCdr,
  RPFCons,
  RPFIsEmpty,
  RPFFirst,
  RPFList,
  RPFIsList,
  RPFMember,
  RPFRest,
  R_NULL
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

class RPFIsEmpty extends RPrimFun {
  constructor(alias?: string) {
    super(alias || "empty?", { arity: 1 });
  }

  call(args: RValue[]): RValue {
    return toRBoolean(isREmptyList(args[0]));
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

class RPFList extends RPrimFun {
  constructor() {
    super("list", {});
  }

  call(args: RValue[]): RValue {
    return new RList(args);
  }
}

class RPFIsList extends RPrimFun {
  constructor(alias?: string) {
    super(alias || "list?", { arity: 1 });
  }

  call(args: RValue[]): RValue {
    return toRBoolean(isRList(args[0]));
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

class RPFRest extends RPrimFun {
  constructor() {
    super("rest", { arity: 1, onlyArgTypeName: TypeName.NON_EMPTY_LIST });
  }

  call(args: RValue[]): RValue {
    return new RList((<RList>args[0]).vals.slice(1));
  }
}
