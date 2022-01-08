import {
  RPrimFun,
  RValue,
  R_FALSE,
  R_TRUE,
  isRData
} from "../rvalue.js";

export {
  RPFAreEq,
  RPFAreEqual,
  RPFAreEqv
};

class RPFAreEq extends RPrimFun {
  constructor() {
    super("eq?", { minArity: 2 });
  }

  call(args: RValue[]): RValue {
    return isRData(args[0]) && args[0].eq(args[1]) ? R_TRUE : R_FALSE;
  }
}

class RPFAreEqual extends RPrimFun {
  constructor() {
    super("equal?", { minArity: 2 });
  }

  call(args: RValue[]): RValue {
    return isRData(args[0]) && args[0].equals(args[1]) ? R_TRUE : R_FALSE;
  }
}

class RPFAreEqv extends RPrimFun {
  constructor() {
    super("eqv?", { minArity: 2 });
  }

  call(args: RValue[]): RValue {
    return isRData(args[0]) && args[0].eqv(args[1]) ? R_TRUE : R_FALSE;
  }
}
