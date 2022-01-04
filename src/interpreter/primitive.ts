import {
  Environment
} from "./environment.js";
import {
  RMath,
  RNumber,
  RPrimFun,
  RValue
} from "./rvalue.js";

export {
  RPlus
};

class RPlus extends RPrimFun {
  call(_: Environment, args: RValue[]): RValue {
    return args.reduce(
      (prev, curr) => RMath.add(<RNumber>prev, <RNumber>curr), new RNumber(0n, 1n)
    );
  }
}

class RMinus extends RPrimFun {
  call(_: Environment, args: RValue[]): RValue {
    return args.reduce(
      (prev, curr) => RMath.add(<RNumber>prev, <RNumber>curr), new RNumber(0n, 1n)
    );
  }
}
