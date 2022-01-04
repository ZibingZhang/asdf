import {
  Environment
} from "./environment.js";
import {
  RNum,
  RPrimFun,
  RVal
} from "./rvalue.js";

export {
  RPlus
};

class RPlus extends RPrimFun {
  call(_: Environment, args: RVal[]): RVal {
    args.reduce((prev, curr) => <RNum>prev, new RNum(0n, 1n));
    return args[0];
  }
}
