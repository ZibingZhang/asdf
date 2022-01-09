import {
  RList,
  RPrimFun,
  RValue,
  R_EMPTY_LIST,
  TypeName,
  toRBoolean
} from "../rvalue.js";

export {
  RPFAppend,
  RPFCons,
  RPFIsEmpty,
  RPFList,
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

class RPFCons extends RPrimFun {
  constructor() {
    super("cons", { arity: 2, argsTypeNames: [TypeName.ANY, TypeName.LIST] });
  }

  call(args: RValue[]): RValue {
    return new RList([args[0], ...(<RList>args[1]).vals]);
  }
}

class RPFIsEmpty extends RPrimFun {
  constructor() {
    super("empty?", { arity: 1 });
  }

  call(args: RValue[]): RValue {
    return toRBoolean(args[0] === R_EMPTY_LIST);
  }
}

class RPFList extends RPrimFun {
  constructor() {
    super(TypeName.LIST, {});
  }

  call(args: RValue[]): RValue {
    return new RList(args);
  }
}
