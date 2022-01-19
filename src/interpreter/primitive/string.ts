import {
  AnyType,
  BooleanType,
  CharacterType,
  ExactNonNegativeIntegerType,
  ListType,
  ProcedureType,
  StringType,
  SymbolType
} from "../types";
import {
  RExactReal,
  RPrimFun,
  RString,
  RValue,
  isRString,
  toRBoolean,
  R_FALSE,
  R_TRUE,
  RList,
  RCharacter,
  RNumber,
  RSymbol
} from "../rvalue";

export {
  RPFExplode,
  RPFMakeString,
  RPFReplicate,
  RPFString,
  RPFStringToSymbol,
  RPFStringAlphabeticHuh,
  RPFStringAppend,
  RPFStringCiLessEqualHuh,
  RPFStringCiLessHuh,
  RPFStringCiEqualHuh,
  RPFStringCiGreaterEqualHuh,
  RPFStringCiGreaterHuh,
  RPFStringContainsCiHuh,
  RPFStringContainsHuh,
  RPFStringCopy,
  RPFStringDowncase,
  RPFStringLength,
  RPFStringLowerCaseHuh,
  RPFStringNumericHuh,
  RPFStringUpcase,
  RPFStringUpperCaseHuh,
  RPFStringLessEqualHuh,
  RPFStringLessHuh,
  RPFStringEqualHuh,
  RPFStringGreaterEqualHuh,
  RPFStringGreaterHuh,
  RPFStringHuh
};

class RPFExplode extends RPrimFun {
  constructor() {
    super("explode");
  }

  getType(): ProcedureType {
    return new ProcedureType([new StringType()], new ListType());
  }

  call(args: RValue[]): RValue {
    return new RList((<RString>args[0]).val.split("").map(ch => new RString(ch)));
  }
}

class RPFMakeString extends RPrimFun {
  constructor() {
    super("make-string");
  }

  getType(): ProcedureType {
    return new ProcedureType([new ExactNonNegativeIntegerType(), new CharacterType()], new StringType());
  }

  call(args: RValue[]): RValue {
    // TODO: fix for special characters, e.g. #\newline
    return new RString((<RCharacter>args[1]).val.repeat(Number((<RNumber>args[0]).numerator)));
  }
}

class RPFReplicate extends RPrimFun {
  constructor() {
    super("replicate");
  }

  getType(): ProcedureType {
    return new ProcedureType([new ExactNonNegativeIntegerType(), new StringType()], new StringType());
  }

  call(args: RValue[]): RValue {
    // TODO: fix for special characters, e.g. #\newline
    return new RString((<RString>args[1]).val.repeat(Number((<RNumber>args[0]).numerator)));
  }
}

class RPFString extends RPrimFun {
  constructor() {
    super("string");
  }

  getType(args: number): ProcedureType {
    return new ProcedureType(new Array(args).fill(new CharacterType()), new StringType());
  }

  call(args: RValue[]): RValue {
    // TODO: fix for special characters, e.g. #\newline
    return new RString((<RCharacter[]>args).map(arg => arg.val).join(""));
  }
}

class RPFStringToSymbol extends RPrimFun {
  constructor() {
    super("string->symbol");
  }

  getType(): ProcedureType {
    return new ProcedureType([new StringType()], new SymbolType());
  }

  call(args: RValue[]): RValue {
    return new RSymbol((<RString>args[0]).val);
  }
}

class RPFStringAlphabeticHuh extends RPrimFun {
  constructor() {
    super("string-alphabetic?");
  }

  getType(): ProcedureType {
    return new ProcedureType([new StringType()], new BooleanType());
  }

  call(args: RValue[]): RValue {
    return toRBoolean(!!(<RString>args[0]).val.match(/^[a-z]*$/i));
  }
}

class RPFStringAppend extends RPrimFun {
  constructor() {
    super("string-append", { minArity: 2, relaxedMinArity: 1 });
  }

  getType(args: number): ProcedureType {
    return new ProcedureType(new Array(args).fill(new StringType()), new StringType());
  }

  call(args: RValue[]): RValue {
    return new RString(args.map(arg => (<RString>arg).val).join(""));
  }
}

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

class RPFStringContainsCiHuh extends RPrimFun {
  constructor() {
    super("string-contains-ci?");
  }

  getType(): ProcedureType {
    return new ProcedureType([new StringType(), new StringType()], new BooleanType());
  }

  call(args: RValue[]): RValue {
    return toRBoolean((<RString>args[1]).val.toLowerCase().includes((<RString>args[0]).val.toLowerCase()));
  }
}

class RPFStringContainsHuh extends RPrimFun {
  constructor() {
    super("string-contains?");
  }

  getType(): ProcedureType {
    return new ProcedureType([new StringType(), new StringType()], new BooleanType());
  }

  call(args: RValue[]): RValue {
    return toRBoolean((<RString>args[1]).val.includes((<RString>args[0]).val));
  }
}

class RPFStringCopy extends RPrimFun {
  constructor() {
    super("string-copy");
  }

  getType(): ProcedureType {
    return new ProcedureType([new StringType()], new StringType());
  }

  call(args: RValue[]): RValue {
    return new RString((<RString>args[0]).val);
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

class RPFStringLowerCaseHuh extends RPrimFun {
  constructor() {
    super("string-lower-case?");
  }

  getType(): ProcedureType {
    return new ProcedureType([new StringType()], new BooleanType());
  }

  call(args: RValue[]): RValue {
    return toRBoolean(!!(<RString>args[0]).val.match(/^[a-z]*$/));
  }
}

class RPFStringNumericHuh extends RPrimFun {
  constructor() {
    super("string-numeric?");
  }

  getType(): ProcedureType {
    return new ProcedureType([new StringType()], new BooleanType());
  }

  call(args: RValue[]): RValue {
    return toRBoolean(!!(<RString>args[0]).val.match(/^[0-9]*$/));
  }
}

class RPFStringUpcase extends RPrimFun {
  constructor() {
    super("string-upcase");
  }

  getType(): ProcedureType {
    return new ProcedureType([new StringType()], new StringType());
  }

  call(args: RValue[]): RValue {
    return new RString((<RString>args[0]).val.toUpperCase());
  }
}

class RPFStringUpperCaseHuh extends RPrimFun {
  constructor() {
    super("string-upper-case?");
  }

  getType(): ProcedureType {
    return new ProcedureType([new StringType()], new BooleanType());
  }

  call(args: RValue[]): RValue {
    return toRBoolean(!!(<RString>args[0]).val.match(/^[A-Z]*$/));
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
