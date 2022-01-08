import {
  RPrimFun,
  RTestResult,
  RValue,
  isRData,
  isRInexact
} from "../rvalue.js";

export {
  RPFCheckExpect
};

class RPFCheckExpect extends RPrimFun {
  constructor() {
    super("check-expect", { arity: 2 });
  }

  call(args: RValue[]): RValue {
    if (isRInexact(args[0]) || isRInexact(args[1])) {
      return new RTestResult(
        false,
        `check-expect cannot compare inexact numbers. Try (check-within ${args[0].stringify()} ${args[1].stringify()} range).`
      );
    } else if (
      args[0] === args[1]
      || (isRData(args[0]) && args[0].equals(args[1]))
    ) {
      return new RTestResult(true);
    } else {
      return new RTestResult(
        false,
        `Actual value ${args[0].stringify()} differs from ${args[1].stringify()}, the expected value.`
      );
    }
  }
}
