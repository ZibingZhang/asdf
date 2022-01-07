import {
  isRBoolean,
  RPrimFun,
  RString,
  RValue,
  R_FALSE,
  R_TRUE
} from "../rvalue.js";

export {
  RPFBooleanToString,
  RPFAreBooleansEqual,
  RPFIsBoolean,
  RPFIsFalse,
  RPFNot
};

class RPFBooleanToString extends RPrimFun {
  constructor() {
    super("boolean->string", { arity: 1, onlyArgTypeName: "boolean" });
  }

  call(args: RValue[]): RValue {
    return args[0] === R_TRUE ? new RString("#true") : new RString("#false");
  }
}

class RPFAreBooleansEqual extends RPrimFun {
  constructor() {
    super("boolean=?", { arity: 2, allArgsTypeName: "boolean" });
  }

  call(args: RValue[]): RValue {
    return args[0] === args[1] ? R_TRUE : R_FALSE;
  }
}

class RPFIsBoolean extends RPrimFun {
  constructor() {
    super("boolean?", { arity: 1 });
  }

  call(args: RValue[]): RValue {
    return isRBoolean(args[0]) ? R_TRUE : R_FALSE;
  }
}

class RPFIsFalse extends RPrimFun {
  constructor() {
    super("false?", { arity: 1 });
  }

  call(args: RValue[]): RValue {
    return args[0] === R_FALSE ? R_TRUE : R_FALSE;
  }
}

class RPFNot extends RPrimFun {
  constructor() {
    super("not", { arity: 1, onlyArgTypeName: "boolean" });
  }

  call(args: RValue[]): RValue {
    return args[0] === R_TRUE ? R_FALSE : R_TRUE;
  }
}
