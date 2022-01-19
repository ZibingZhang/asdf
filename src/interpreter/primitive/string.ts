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
  toRBoolean,
  R_FALSE,
  R_TRUE
} from "../rvalue";

export {
  RPFStringCiLessEqualHuh,
  RPFStringCiLessHuh,
  RPFStringCiEqualHuh,
  RPFStringCiGreaterEqualHuh,
  RPFStringCiGreaterHuh,
  RPFStringDowncase,
  RPFStringLength,
  RPFStringLessEqualHuh,
  RPFStringLessHuh,
  RPFStringEqualHuh,
  RPFStringGreaterEqualHuh,
  RPFStringGreaterHuh,
  RPFStringHuh
};

class RPFStringCiLessEqualHuh extends RPrimFun {
  constructor() {
    super("string-ci<=?", { minArity: 2, relaxedMinArity: 1 });
  }

  getType(args: number): ProcedureType {
    return new ProcedureType(new Array(args).fill(new StringType()), new BooleanType());
  }

  call(args: RValue[]): RValue {
    for (let idx = 0; idx < args.length - 1; idx++) {
      if (!((<RString>args[idx]).val.toLowerCase() <= (<RString>args[idx + 1]).val.toLowerCase())) {
        return R_FALSE;
      }
    }
    return R_TRUE;
  }
}

class RPFStringCiLessHuh extends RPrimFun {
  constructor() {
    super("string-ci<?", { minArity: 2, relaxedMinArity: 1 });
  }

  getType(args: number): ProcedureType {
    return new ProcedureType(new Array(args).fill(new StringType()), new BooleanType());
  }

  call(args: RValue[]): RValue {
    for (let idx = 0; idx < args.length - 1; idx++) {
      if (!((<RString>args[idx]).val.toLowerCase() < (<RString>args[idx + 1]).val.toLowerCase())) {
        return R_FALSE;
      }
    }
    return R_TRUE;
  }
}

class RPFStringCiEqualHuh extends RPrimFun {
  constructor() {
    super("string-ci=?", { minArity: 2, relaxedMinArity: 1 });
  }

  getType(args: number): ProcedureType {
    return new ProcedureType(new Array(args).fill(new StringType()), new BooleanType());
  }

  call(args: RValue[]): RValue {
    for (let idx = 0; idx < args.length - 1; idx++) {
      if (!((<RString>args[idx]).val.toLowerCase() === (<RString>args[idx + 1]).val.toLowerCase())) {
        return R_FALSE;
      }
    }
    return R_TRUE;
  }
}

class RPFStringCiGreaterEqualHuh extends RPrimFun {
  constructor() {
    super("string-ci>=?", { minArity: 2, relaxedMinArity: 1 });
  }

  getType(args: number): ProcedureType {
    return new ProcedureType(new Array(args).fill(new StringType()), new BooleanType());
  }

  call(args: RValue[]): RValue {
    for (let idx = 0; idx < args.length - 1; idx++) {
      if (!((<RString>args[idx]).val.toLowerCase() >= (<RString>args[idx + 1]).val.toLowerCase())) {
        return R_FALSE;
      }
    }
    return R_TRUE;
  }
}

class RPFStringCiGreaterHuh extends RPrimFun {
  constructor() {
    super("string-ci>?", { minArity: 2, relaxedMinArity: 1 });
  }

  getType(args: number): ProcedureType {
    return new ProcedureType(new Array(args).fill(new StringType()), new BooleanType());
  }

  call(args: RValue[]): RValue {
    for (let idx = 0; idx < args.length - 1; idx++) {
      if (!((<RString>args[idx]).val.toLowerCase() >= (<RString>args[idx + 1]).val.toLowerCase())) {
        return R_FALSE;
      }
    }
    return R_TRUE;
  }
}

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

class RPFStringLessEqualHuh extends RPrimFun {
  constructor() {
    super("string<=?", { minArity: 2, relaxedMinArity: 1 });
  }

  getType(args: number): ProcedureType {
    return new ProcedureType(new Array(args).fill(new StringType()), new BooleanType());
  }

  call(args: RValue[]): RValue {
    for (let idx = 0; idx < args.length - 1; idx++) {
      if (!((<RString>args[idx]).val <= (<RString>args[idx + 1]).val)) {
        return R_FALSE;
      }
    }
    return R_TRUE;
  }
}

class RPFStringLessHuh extends RPrimFun {
  constructor() {
    super("string<?", { minArity: 2, relaxedMinArity: 1 });
  }

  getType(args: number): ProcedureType {
    return new ProcedureType(new Array(args).fill(new StringType()), new BooleanType());
  }

  call(args: RValue[]): RValue {
    for (let idx = 0; idx < args.length - 1; idx++) {
      if (!((<RString>args[idx]).val < (<RString>args[idx + 1]).val)) {
        return R_FALSE;
      }
    }
    return R_TRUE;
  }
}

class RPFStringEqualHuh extends RPrimFun {
  constructor() {
    super("string=?", { minArity: 2, relaxedMinArity: 1 });
  }

  getType(args: number): ProcedureType {
    return new ProcedureType(new Array(args).fill(new StringType()), new BooleanType());
  }

  call(args: RValue[]): RValue {
    for (let idx = 0; idx < args.length - 1; idx++) {
      if (!((<RString>args[idx]).val === (<RString>args[idx + 1]).val)) {
        return R_FALSE;
      }
    }
    return R_TRUE;
  }
}

class RPFStringGreaterEqualHuh extends RPrimFun {
  constructor() {
    super("string>=?", { minArity: 2, relaxedMinArity: 1 });
  }

  getType(args: number): ProcedureType {
    return new ProcedureType(new Array(args).fill(new StringType()), new BooleanType());
  }

  call(args: RValue[]): RValue {
    for (let idx = 0; idx < args.length - 1; idx++) {
      if (!((<RString>args[idx]).val >= (<RString>args[idx + 1]).val)) {
        return R_FALSE;
      }
    }
    return R_TRUE;
  }
}

class RPFStringGreaterHuh extends RPrimFun {
  constructor() {
    super("string>?", { minArity: 2, relaxedMinArity: 1 });
  }

  getType(args: number): ProcedureType {
    return new ProcedureType(new Array(args).fill(new StringType()), new BooleanType());
  }

  call(args: RValue[]): RValue {
    for (let idx = 0; idx < args.length - 1; idx++) {
      if (!((<RString>args[idx]).val >= (<RString>args[idx + 1]).val)) {
        return R_FALSE;
      }
    }
    return R_TRUE;
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
