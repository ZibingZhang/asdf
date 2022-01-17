import {
  AnyType,
  BooleanType,
  ExactNonNegativeIntegerType,
  ProcedureType,
  StringType
} from "../types";
import {
  RExactReal,
  RPrimFun,
  RString,
  RValue,
  isRString,
  toRBoolean
} from "../rvalue";

export {
  RPFStringDowncase,
  RPFStringLength,
  RPFStringLessEqualThanHuh,
  RPFStringHuh
};

class RPFStringDowncase extends RPrimFun {
  constructor() {
    super("string-downcase");
  }

  getType(): ProcedureType {
    return new ProcedureType([new StringType()], new StringType());
  }

  call(args: RValue[]): RValue {
    return new RString((<RString>args[0]).val.toLowerCase());
  }
}

class RPFStringLength extends RPrimFun {
  constructor() {
    super("string-length");
  }

  getType(): ProcedureType {
    return new ProcedureType([new StringType()], new ExactNonNegativeIntegerType());
  }

  call(args: RValue[]): RValue {
    return new RExactReal(BigInt((<RString>args[0]).val.length));
  }
}

class RPFStringLessEqualThanHuh extends RPrimFun {
  constructor() {
    super("string<=?");
  }

  getType(): ProcedureType {
    return new ProcedureType([new StringType(), new StringType()], new BooleanType());
  }

  call(args: RValue[]): RValue {
    return toRBoolean((<RString>args[0]).val <= (<RString>args[1]).val);
  }
}

class RPFStringHuh extends RPrimFun {
  constructor() {
    super("string?");
  }

  getType(): ProcedureType {
    return new ProcedureType([new AnyType()], new BooleanType());
  }

  call(args: RValue[]): RValue {
    return toRBoolean(isRString(args[0]));
  }
}
