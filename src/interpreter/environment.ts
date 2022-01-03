import { RVal } from "./value";

export {
  BASE_ENVIRONMENT,
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
      throw "Illegal state";
    } else {
      return this.parentEnv.get(name);
    }
  }
}

const BASE_ENVIRONMENT = new Environment();
