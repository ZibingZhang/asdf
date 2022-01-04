import {
  SC_UNDEFINED_FUNCTION_ERR,
  SC_UNDEFINED_VARIABLE_ERR
} from "./error.js";
import {
  StageError
} from "./pipeline.js";
import {
  RDivide,
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
  PRIMITIVE_ENVIRONMENT,
  Environment,
  EnvironmentValType
};

enum EnvironmentValType {
  Function,
  Variable
}

class Environment {
  private map: Map<string, RValue>;

  constructor(readonly parentEnv: Environment | null = null) {
    this.map = new Map();
  }

  set(name: string, value: RValue) {
    this.map.set(name, value);
  }

  get(type: EnvironmentValType, name: string, sourceSpan: SourceSpan): RValue {
    const val = this.map.get(name);
    if (val) {
      return val;
    } else if (!this.parentEnv) {
      if (type === EnvironmentValType.Function) {
        throw new StageError(
          SC_UNDEFINED_FUNCTION_ERR(name),
          sourceSpan
        );
      } else {
        throw new StageError(
          SC_UNDEFINED_VARIABLE_ERR(name),
          sourceSpan
        );
      }
    } else {
      return this.parentEnv.get(type, name, sourceSpan);
    }
  }

  names(): IterableIterator<string> {
    return this.map.keys();
  }
}

const PRIMITIVE_ENVIRONMENT = new Environment();

function addFnToPrimEnv(name: string, cls: typeof RPrimFun, config: RPrimFunConfig) {
  PRIMITIVE_ENVIRONMENT.set(name, new cls(name, config));
}
function addVarToPrimEnv(name: string, val: RData) {
  PRIMITIVE_ENVIRONMENT.set(name, val);
}

addFnToPrimEnv("/", RDivide, { minArity: 2, allArgsTypeName: "number" });
addFnToPrimEnv("-", RMinus, { minArity: 1, allArgsTypeName: "number" });
addFnToPrimEnv("*", RMultiply, { minArity: 2, allArgsTypeName: "number" });
addFnToPrimEnv("+", RPlus, { minArity: 2, allArgsTypeName: "number" });

addVarToPrimEnv("e", new RNumber(6121026514868073n, 2251799813685248n));
addVarToPrimEnv("pi", new RNumber(884279719003555n, 281474976710656n));
