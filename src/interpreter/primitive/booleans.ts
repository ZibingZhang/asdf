import {
  RBoolean,
  RPrimFun,
  RString,
  RValue,
  TypeName,
  isRBoolean,
  toRBoolean
} from "../rvalue";

export {
  RPFBooleanToString,
  RPFAreBooleansEqual,
  RPFBooleanHuh,
  RPFFalseHuh,
  RPFNot
};

class RPFBooleanToString extends RPrimFun {
  constructor() {
    super("boolean->string", { arity: 1, onlyArgTypeName: TypeName.BOOLEAN });
  }

  call(args: RValue[]): RValue {
    return (<RBoolean>args[0]).val ? new RString("#true") : new RString("#false");
  }
}

class RPFAreBooleansEqual extends RPrimFun {
  constructor() {
    super("boolean=?", { arity: 2, allArgsTypeName: TypeName.BOOLEAN });
  }

  call(args: RValue[]): RValue {
    return toRBoolean(args[0] === args[1]);
  }
}

class RPFBooleanHuh extends RPrimFun {
  constructor() {
    super("boolean?", { arity: 1 });
  }

  call(args: RValue[]): RValue {
    return toRBoolean(isRBoolean(args[0]));
  }
}

class RPFFalseHuh extends RPrimFun {
  constructor() {
    super("false?", { arity: 1 });
  }

  call(args: RValue[]): RValue {
    return toRBoolean((<RBoolean>args[0]).val === false);
  }
}

class RPFNot extends RPrimFun {
  constructor() {
    super("not", { arity: 1, onlyArgTypeName: TypeName.BOOLEAN });
  }

  call(args: RValue[]): RValue {
    return toRBoolean(!(<RBoolean>args[0]).val);
  }
}
