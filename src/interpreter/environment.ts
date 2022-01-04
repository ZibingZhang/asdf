import {
  RPlus
} from "./primitive.js";
import {
  isRNum,
  RVal
} from "./rvalue.js";

export {
  PRIMITIVE_ENVIRONMENT,
  Environment
};

class Environment {
  private map: Map<string, RVal>;

  constructor(readonly parentEnv: Environment | null = null) {
    this.map = new Map();
  }

  set(name: string, value: RVal) {
    this.map.set(name, value);
  }

  get(name: string): RVal {
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

PRIMITIVE_ENVIRONMENT.set("+", new RPlus("+", 2, "number", isRNum));
