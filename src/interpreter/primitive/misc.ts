import {
  RPrimFun,
  RValue,
  isRData,
  isRStruct,
  toRBoolean
} from "../rvalue.js";

export {
  RPFAreEq,
  RPFAreEqual,
  RPFAreEqv,
  RPFIdentity,
  RPFIsStruct
};

class RPFAreEq extends RPrimFun {
  constructor() {
    super("eq?", { minArity: 2 });
  }

  call(args: RValue[]): RValue {
    return toRBoolean(isRData(args[0]) && args[0].eq(args[1]));
  }
}

class RPFAreEqual extends RPrimFun {
  constructor() {
    super("equal?", { minArity: 2 });
  }

  call(args: RValue[]): RValue {
    return toRBoolean(isRData(args[0]) && args[0].equals(args[1]));
  }
}

class RPFAreEqv extends RPrimFun {
  constructor() {
    super("eqv?", { minArity: 2 });
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
