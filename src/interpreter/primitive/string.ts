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
  RCharacter,
  RExactReal,
  RList,
  RNumber,
  RPrimProc,
  RString,
  RSymbol,
  RValue,
  R_FALSE,
  R_TRUE,
  isRString,
  toRBoolean
} from "../rvalue";

export {
  RPPExplode,
  RPPMakeString,
  RPPReplicate,
  RPPString,
  RPPStringToSymbol,
  RPPStringAlphabeticHuh,
  RPPStringAppend,
  RPPStringCiLessEqualHuh,
  RPPStringCiLessHuh,
  RPPStringCiEqualHuh,
  RPPStringCiGreaterEqualHuh,
  RPPStringCiGreaterHuh,
  RPPStringContainsCiHuh,
  RPPStringContainsHuh,
  RPPStringCopy,
  RPPStringDowncase,
  RPPStringLength,
  RPPStringLowerCaseHuh,
  RPPStringNumericHuh,
  RPPStringUpcase,
  RPPStringUpperCaseHuh,
  RPPStringLessEqualHuh,
  RPPStringLessHuh,
  RPPStringEqualHuh,
  RPPStringGreaterEqualHuh,
  RPPStringGreaterHuh,
  RPPStringHuh
};

class RPPExplode extends RPrimProc {
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

class RPPMakeString extends RPrimProc {
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

class RPPReplicate extends RPrimProc {
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

class RPPString extends RPrimProc {
  constructor() {
    super("string");
  }

  getType(args: number): ProcedureType {
    return new ProcedureType(new Array(args).fill(new CharacterType()), new StringType());
  }

  call(args: RValue[]): RValue {
    return new RString((<RCharacter[]>args).map(arg => arg.val).join(""));
  }
}

class RPPStringToSymbol extends RPrimProc {
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

class RPPStringAlphabeticHuh extends RPrimProc {
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

class RPPStringAppend extends RPrimProc {
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

class RPPStringCiLessEqualHuh extends RPrimProc {
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

class RPPStringCiLessHuh extends RPrimProc {
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

class RPPStringCiEqualHuh extends RPrimProc {
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

class RPPStringCiGreaterEqualHuh extends RPrimProc {
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

class RPPStringCiGreaterHuh extends RPrimProc {
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

class RPPStringContainsCiHuh extends RPrimProc {
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

class RPPStringContainsHuh extends RPrimProc {
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

class RPPStringCopy extends RPrimProc {
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

class RPPStringDowncase extends RPrimProc {
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

class RPPStringLength extends RPrimProc {
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

class RPPStringLowerCaseHuh extends RPrimProc {
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

class RPPStringNumericHuh extends RPrimProc {
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

class RPPStringUpcase extends RPrimProc {
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

class RPPStringUpperCaseHuh extends RPrimProc {
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

class RPPStringLessEqualHuh extends RPrimProc {
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

class RPPStringLessHuh extends RPrimProc {
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

class RPPStringEqualHuh extends RPrimProc {
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

class RPPStringGreaterEqualHuh extends RPrimProc {
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

class RPPStringGreaterHuh extends RPrimProc {
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

class RPPStringHuh extends RPrimProc {
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
