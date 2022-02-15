import {
  BooleanType,
  CharacterType,
  ExactNonNegativeIntegerType,
  ProcedureType
} from "../values/types";
import {
  RCharacter,
  RPrimProc,
  RValue,
  toRBoolean
} from "../values/rvalue";
import {
  RMath
} from "../values/rmath";

export {
  RPPCharToInteger,
  RPPCharAlphabeticHuh
};

class RPPCharToInteger extends RPrimProc {
  constructor() {
    super("char->integer");
  }

  getType(): ProcedureType {
    return new ProcedureType([new CharacterType()], new ExactNonNegativeIntegerType());
  }

  call(args: RValue[]): RValue {
    return RMath.make(true, BigInt((<RCharacter>args[0]).val.charCodeAt(0)));
  }
}

class RPPCharAlphabeticHuh extends RPrimProc {
  constructor() {
    super("char-alphabetic?");
  }

  getType(): ProcedureType {
    return new ProcedureType([new CharacterType()], new BooleanType());
  }

  call(args: RValue[]): RValue {
    return toRBoolean(!!(<RCharacter>args[0]).val.match(/^[a-z]$/i));
  }
}
