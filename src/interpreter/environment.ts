import {
  RDivide,
  RMinus,
  RMultiply,
  RPlus
} from "./primitive.js";
import {
  RPrimFun,
  RPrimFunConfig,
  RValue
} from "./rvalue.js";

export {
  PRIMITIVE_ENVIRONMENT,
  Environment
};

class Environment {
  private map: Map<string, RValue>;

  constructor(readonly parentEnv: Environment | null = null) {
    this.map = new Map();
  }

  set(name: string, value: RValue) {
    this.map.set(name, value);
  }

  get(name: string): RValue {
    const val = this.map.get(name);
    if (val) {
      return val;
    } else if (!this.parentEnv) {
      throw "illegal state: name not in environment";
    } else {
      return this.parentEnv.get(name);
    }
  }
}

const PRIMITIVE_ENVIRONMENT = new Environment();

function addToPrimEnv(name: string, cls: typeof RPrimFun, config: RPrimFunConfig) {
  PRIMITIVE_ENVIRONMENT.set(name, new cls(name, config));
}

addToPrimEnv("/", RDivide, { minArity: 2, allArgsTypeName: "number" });
addToPrimEnv("-", RMinus, { minArity: 1, allArgsTypeName: "number" });
addToPrimEnv("*", RMultiply, { minArity: 2, allArgsTypeName: "number" });
addToPrimEnv("+", RPlus, { minArity: 2, allArgsTypeName: "number" });
