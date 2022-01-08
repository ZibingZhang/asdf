import {
  RBoolean,
  RPrimFun,
  RString,
  RValue,
  isRBoolean,
  toRBoolean
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
    return (<RBoolean>args[0]).val ? new RString("#true") : new RString("#false");
  }
}

class RPFAreBooleansEqual extends RPrimFun {
  constructor() {
    super("boolean=?", { arity: 2, allArgsTypeName: "boolean" });
  }

  call(args: RValue[]): RValue {
    return toRBoolean(args[0] === args[1]);
  }
}

class RPFIsBoolean extends RPrimFun {
  constructor() {
    super("boolean?", { arity: 1 });
  }

  call(args: RValue[]): RValue {
    return toRBoolean(isRBoolean(args[0]));
  }
}

class RPFIsFalse extends RPrimFun {
  constructor() {
    super("false?", { arity: 1 });
  }

  call(args: RValue[]): RValue {
    return toRBoolean((<RBoolean>args[0]).val === false);
  }
}

class RPFNot extends RPrimFun {
  constructor() {
    super("not", { arity: 1, onlyArgTypeName: "boolean" });
  }

  call(args: RValue[]): RValue {
    return toRBoolean(!(<RBoolean>args[0]).val);
  }
}
