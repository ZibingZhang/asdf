import {
  SC_USED_BEFORE_DEFINITION_ERR
} from "./error.js";
import {
  StageError
} from "./pipeline.js";
import {
  RDivide,
  RIsZero,
  RMinus,
  RMultiply,
  RPlus
} from "./primitive.js";
import {
  RData,
  RNumber,
  RPrimFun,
  RPrimFunConfig,
  RValue
} from "./rvalue.js";
import {
  SourceSpan
} from "./sourcespan.js";

export {
  PRIMITIVE_DATA_NAMES,
  PRIMITIVE_ENVIRONMENT,
  PRIMITIVE_FUNCTION_NAMES,
  Environment
};

class Environment {
  parentEnv: Environment | null;
  private map: Map<string, RValue>;

  constructor(
    parentEnv: Environment | null = null,
  ) {
    this.parentEnv = parentEnv;
    this.map = new Map();
  }

  set(name: string, value: RValue) {
    this.map.set(name, value);
  }

  get(name: string, sourceSpan: SourceSpan): RValue {
    const val = this.map.get(name);
    if (val) {
      return val;
    } else if (!this.parentEnv) {
      throw new StageError(
        SC_USED_BEFORE_DEFINITION_ERR(name),
        sourceSpan
      );
    } else {
      return this.parentEnv.get(name, sourceSpan);
    }
  }

  has(name: string): boolean {
    return this.names().includes(name);
  }

  copy(): Environment {
    const env = new Environment();
    for (const entry of this.map.entries()) {
      env.set(entry[0], entry[1]);
    }
    let ancestorEnv: Environment | null = this;
    while (ancestorEnv.parentEnv) {
      ancestorEnv = ancestorEnv.parentEnv;
      for (const entry of ancestorEnv.map.entries()) {
        env.set(entry[0], entry[1]);
      }
    }
    return env;
  }

  names(): Array<string> {
    const names = [...this.map.keys()];
    if (this.parentEnv) {
      names.push(...this.parentEnv.names());
    }
    return names;
  }
}

const PRIMITIVE_ENVIRONMENT = new Environment();
const PRIMITIVE_DATA_NAMES: Set<string> = new Set();
const PRIMITIVE_FUNCTION_NAMES: Set<string> = new Set();


function addFnToPrimEnv(name: string, cls: typeof RPrimFun, config: RPrimFunConfig) {
  PRIMITIVE_FUNCTION_NAMES.add(name);
  PRIMITIVE_ENVIRONMENT.set(name, new cls(name, config));
}
function addDataToPrimEnv(name: string, val: RData) {
  PRIMITIVE_DATA_NAMES.add(name);
  PRIMITIVE_ENVIRONMENT.set(name, val);
}

addFnToPrimEnv("/", RDivide, { minArity: 2, allArgsTypeName: "number" });
addFnToPrimEnv("-", RMinus, { minArity: 1, allArgsTypeName: "number" });
addFnToPrimEnv("*", RMultiply, { minArity: 2, allArgsTypeName: "number" });
addFnToPrimEnv("+", RPlus, { minArity: 2, allArgsTypeName: "number" });
addFnToPrimEnv("zero?", RIsZero, { arity: 1, onlyArgTypeName: "number" });

addDataToPrimEnv("e", new RNumber(6121026514868073n, 2251799813685248n));
addDataToPrimEnv("pi", new RNumber(884279719003555n, 281474976710656n));
