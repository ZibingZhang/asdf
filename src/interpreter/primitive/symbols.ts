import {
  AnyType,
  BooleanType,
  FunctionType,
  StringType,
  SymbolType
} from "../types";
import {
  RPrimFun,
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

class RPFSymbolToString extends RPrimFun {
  constructor() {
    super("symbol->string");
  }

  getType(): FunctionType {
    return new FunctionType([new SymbolType()], new StringType());
  }

  call(args: RValue[]): RValue {
    return new RString((<RSymbol>args[0]).val);
  }
}

class RPFAreSymbolsEqual extends RPrimFun {
  constructor() {
    super("symbol=?");
  }

  getType(): FunctionType {
    return new FunctionType([new SymbolType(), new SymbolType()], new BooleanType());
  }

  call(args: RValue[]): RValue {
    return toRBoolean((<RSymbol>args[0]).val === (<RSymbol>args[1]).val);
  }
}

class RPFSymbolHuh extends RPrimFun {
  constructor() {
    super("symbol?");
  }

  getType(): FunctionType {
    return new FunctionType([new AnyType()], new BooleanType());
  }

  call(args: RValue[]): RValue {
    return toRBoolean(isRSymbol(args[0]));
  }
}
