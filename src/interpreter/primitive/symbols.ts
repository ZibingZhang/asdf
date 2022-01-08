import {
  RPrimFun,
  RString,
  RSymbol,
  RValue,
  R_FALSE,
  R_TRUE,
  isRSymbol
} from "../rvalue.js";

export {
  RPFSymbolToString,
  RPFAreSymbolsEqual,
  RPFIsSymbol
};

class RPFSymbolToString extends RPrimFun {
  constructor() {
    super("symbol->string", { arity: 1, onlyArgTypeName: "symbol" });
  }

  call(args: RValue[]): RValue {
    return new RString((<RSymbol>args[0]).val);
  }
}

class RPFAreSymbolsEqual extends RPrimFun {
  constructor() {
    super("symbol=?", { arity: 2, allArgsTypeName: "symbol" });
  }

  call(args: RValue[]): RValue {
    return (<RSymbol>args[0]).val === (<RSymbol>args[1]).val ? R_TRUE : R_FALSE;
  }
}

class RPFIsSymbol extends RPrimFun {
  constructor() {
    super("symbol?", { arity: 1 });
  }

  call(args: RValue[]): RValue {
    return isRSymbol(args[0]) ? R_TRUE : R_FALSE;
  }
}
