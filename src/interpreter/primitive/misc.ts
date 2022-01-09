import {
  RPrimFun,
  RValue,
  isRData,
  isRStruct,
  toRBoolean,
  RNumber,
  TypeName
} from "../rvalue.js";

export {
  RPFAreEq,
  RPFAreEqual,
  RPFAreEqualWithin,
  RPFAreEqv,
  RPFIdentity,
  RPFIsStruct
};

class RPFAreEq extends RPrimFun {
  constructor() {
    super("eq?", { arity: 2 });
  }

  call(args: RValue[]): RValue {
    return toRBoolean(isRData(args[0]) && args[0].eq(args[1]));
  }
}

class RPFAreEqual extends RPrimFun {
  constructor() {
    super("equal?", { arity: 2 });
  }

  call(args: RValue[]): RValue {
    return toRBoolean(isRData(args[0]) && args[0].equal(args[1]));
  }
}

class RPFAreEqualWithin extends RPrimFun {
  constructor() {
    super("equal~?", { arity: 3, argsTypeNames: [TypeName.ANY, TypeName.ANY, TypeName.NON_NEGATIVE_REAL] });
  }

  call(args: RValue[]): RValue {
    const ep = (<RNumber>args[2]).toInexactDecimal().val;
    return toRBoolean(isRData(args[0]) && args[0].equalWithin(args[1], ep));
  }
}

class RPFAreEqv extends RPrimFun {
  constructor() {
    super("eqv?", { arity: 2 });
  }

  call(args: RValue[]): RValue {
    return toRBoolean(isRData(args[0]) && args[0].eqv(args[1]));
  }
}

class RPFIdentity extends RPrimFun {
  constructor() {
    super("identity", { arity: 1 });
  }

  call(args: RValue[]): RValue {
    return args[0];
  }
}

class RPFIsStruct extends RPrimFun {
  constructor() {
    super("struct?", { arity: 1 });
  }

  call(args: RValue[]): RValue {
    return toRBoolean(isRStruct(args[0]));
  }
}
