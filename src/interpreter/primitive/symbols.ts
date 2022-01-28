import {
  AnyType,
  BooleanType,
  ProcedureType,
  StringType,
  SymbolType
} from "../types";
import {
  RPrimProc,
  RString,
  RSymbol,
  RValue,
  isRSymbol,
  toRBoolean
} from "../rvalue";

export {
  RPFSymbolToString,
  RPFAreSymbolsEqual,
  RPFSymbolHuh
};

class RPFSymbolToString extends RPrimProc {
  constructor() {
    super("symbol->string");
  }

  getType(): ProcedureType {
    return new ProcedureType([new SymbolType()], new StringType());
  }

  call(args: RValue[]): RValue {
    return new RString((<RSymbol>args[0]).val);
  }
}

class RPFAreSymbolsEqual extends RPrimProc {
  constructor() {
    super("symbol=?");
  }

  getType(): ProcedureType {
    return new ProcedureType([new SymbolType(), new SymbolType()], new BooleanType());
  }

  call(args: RValue[]): RValue {
    return toRBoolean((<RSymbol>args[0]).val === (<RSymbol>args[1]).val);
  }
}

class RPFSymbolHuh extends RPrimProc {
  constructor() {
    super("symbol?");
  }

  getType(): ProcedureType {
    return new ProcedureType([new AnyType()], new BooleanType());
  }

  call(args: RValue[]): RValue {
    return toRBoolean(isRSymbol(args[0]));
  }
}
