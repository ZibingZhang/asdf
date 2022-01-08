import {
  RPrimFun,
  RString,
  RSymbol,
  RValue,
  isRSymbol,
  toRBoolean
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
    return toRBoolean((<RSymbol>args[0]).val === (<RSymbol>args[1]).val);
  }
}

class RPFIsSymbol extends RPrimFun {
  constructor() {
    super("symbol?", { arity: 1 });
  }

  call(args: RValue[]): RValue {
    return toRBoolean(isRSymbol(args[0]));
  }
}
