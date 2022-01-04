import {
  Environment
} from "./environment.js";
import {
  RMath,
  RNum,
  RPrimFun,
  RVal
} from "./rvalue.js";

export {
  RPlus
};

class RPlus extends RPrimFun {
  call(_: Environment, args: RVal[]): RVal {
    return args.reduce((prev, curr) => RMath.add(<RNum>prev, <RNum>curr), new RNum(0n, 1n));
  }
}
