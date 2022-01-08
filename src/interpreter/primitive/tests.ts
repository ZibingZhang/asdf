import {
  isRSymbol,
  RPrimFun,
  RString,
  RSymbol,
  RTestResult,
  RValue,
  R_FALSE,
  R_TRUE
} from "../rvalue.js";

export {
  RPFCheckExpect,
};

class RPFCheckExpect extends RPrimFun {
  constructor() {
    super("check-expect", { arity: 2 });
  }

  call(args: RValue[]): RValue {
    if (args[0] === args[1]) {
      return new RTestResult(true);
    } else {
      return new RTestResult(false, `Actual value ${args[0].stringify()} differs from ${args[1].stringify()}, the expected value.`);
    }
  }
}
