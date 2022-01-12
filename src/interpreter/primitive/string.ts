import {
  RExactReal,
  RPrimFun,
  RString,
  RValue,
  TypeName,
  isRString,
  toRBoolean
} from "../rvalue";

export {
  RPFStringDowncase,
  RPFStringLength,
  RPFIsStringLessEqualThan,
  RPFIsString
};

class RPFStringDowncase extends RPrimFun {
  constructor() {
    super("string-downcase", { arity: 1, onlyArgTypeName: TypeName.STRING });
  }

  call(args: RValue[]): RValue {
    return new RString((<RString>args[0]).val.toLowerCase());
  }
}

class RPFStringLength extends RPrimFun {
  constructor() {
    super("string-length", { arity: 1, onlyArgTypeName: TypeName.STRING });
  }

  call(args: RValue[]): RValue {
    return new RExactReal(BigInt((<RString>args[0]).val.length));
  }
}

class RPFIsStringLessEqualThan extends RPrimFun {
  constructor() {
    super("string<=?", { arity: 2, allArgsTypeName: TypeName.STRING });
  }

  call(args: RValue[]): RValue {
    return toRBoolean((<RString>args[0]).val <= (<RString>args[1]).val);
  }
}

class RPFIsString extends RPrimFun {
  constructor() {
    super("string?", { arity: 1 });
  }

  call(args: RValue[]): RValue {
    return toRBoolean(isRString(args[0]));
  }
}
