import {
  AnyType,
  BooleanType,
  ProcedureType,
  StringType,
  SymbolType
} from "../values/types";
import {
  RPrimProc,
  RString,
  RSymbol,
  RValue,
  isRSymbol,
  toRBoolean
} from "../values/rvalue";

export {
  RPPSymbolToString,
  RPPAreSymbolsEqual,
  RPPSymbolHuh
};

class RPPSymbolToString extends RPrimProc {
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

class RPPAreSymbolsEqual extends RPrimProc {
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

class RPPSymbolHuh extends RPrimProc {
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
