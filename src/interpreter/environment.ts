import {
  RData,
  RIsStructFun,
  RMakeStructFun,
  RPrimFun,
  RPrimFunConfig,
  RStructGetFun,
  RValue,
  R_EMPTY_LIST,
  R_FALSE,
  R_TRUE
} from "./rvalue.js";
import {
  RPC_E,
  RPC_PI,
  RPFAbs,
  RPFAdd1,
  RPFDivide,
  RPFEqual,
  RPFGreater,
  RPFGreaterThan,
  RPFIsZero,
  RPFLess,
  RPFLessThan,
  RPFMinus,
  RPFMultiply,
  RPFPlus,
  RPFRandom,
  RPFSub1
} from "./primitive/numbers.js";
import {
  RPFAppend,
  RPFCons,
  RPFIsEmpty,
  RPFList,
  R_NULL
} from "./primitive/lists.js";
import {
  RPFAreBooleansEqual,
  RPFBooleanToString,
  RPFIsBoolean,
  RPFIsFalse,
  RPFNot
} from "./primitive/booleans.js";
import {
  RPFAreEq,
  RPFAreEqual,
  RPFAreEqv,
  RPFIdentity,
  RPFIsStruct
} from "./primitive/misc.js";
import {
  RPFAreSymbolsEqual,
  RPFIsSymbol,
  RPFSymbolToString
} from "./primitive/symbols.js";
import {
  SC_USED_BEFORE_DEFINITION_ERR
} from "./error.js";
import {
  SourceSpan
} from "./sourcespan.js";
import {
  StageError
} from "./pipeline.js";

export {
  PRIMITIVE_DATA_NAMES,
  PRIMITIVE_ENVIRONMENT,
  PRIMITIVE_FUNCTION_NAMES,
  PRIMITIVE_TEST_FUNCTIONS,
  Environment
};

class Environment {
  parentEnv: Environment | null;
  private map: Map<string, RValue>;

  constructor(parentEnv: Environment | null = null) {
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
      if (PRIMITIVE_ENVIRONMENT.map.has(name)) {
        return PRIMITIVE_ENVIRONMENT.get(name, sourceSpan);
      } else {
        throw new StageError(
          SC_USED_BEFORE_DEFINITION_ERR(name),
          sourceSpan
        );
      }
    } else {
      return this.parentEnv.get(name, sourceSpan);
    }
  }

  copy(): Environment {
    const env = new Environment();
    for (const entry of this.map.entries()) {
      env.set(entry[0], entry[1]);
    }
    /* eslint-disable @typescript-eslint/no-this-alias */
    let ancestorEnv: Environment | null = this;
    while (ancestorEnv.parentEnv) {
      ancestorEnv = ancestorEnv.parentEnv;
      for (const entry of ancestorEnv.map.entries()) {
        env.set(entry[0], entry[1]);
      }
    }
    return env;
  }
}

const PRIMITIVE_ENVIRONMENT = new Environment();
const PRIMITIVE_DATA_NAMES: Set<string> = new Set();
const PRIMITIVE_FUNCTION_NAMES: Set<string> = new Set();
const PRIMITIVE_TEST_FUNCTIONS: Map<string, RPrimFunConfig> = new Map();

PRIMITIVE_TEST_FUNCTIONS.set("check-expect", { arity: 2 });
PRIMITIVE_TEST_FUNCTIONS.set("check-random", { arity: 2 });

function addDataToPrimEnv(name: string, val: RData) {
  PRIMITIVE_DATA_NAMES.add(name);
  PRIMITIVE_ENVIRONMENT.set(name, val);
}

function addFnToPrimEnv(val: RPrimFun) {
  PRIMITIVE_FUNCTION_NAMES.add(val.name);
  PRIMITIVE_ENVIRONMENT.set(val.name, val);
}

function addStructToPrimEnv(name: string, fields: string[]) {
  PRIMITIVE_FUNCTION_NAMES.add(`make-${name}`);
  PRIMITIVE_FUNCTION_NAMES.add(`${name}?`);
  fields.forEach((field) => {
    PRIMITIVE_FUNCTION_NAMES.add(`${name}-${field}`);
  });
  PRIMITIVE_ENVIRONMENT.set(`make-${name}`, new RMakeStructFun(name, fields.length));
  PRIMITIVE_ENVIRONMENT.set(`${name}?`, new RIsStructFun(name));
  fields.forEach((field, idx) => {
    PRIMITIVE_ENVIRONMENT.set(`${name}-${field}`, new RStructGetFun(name, field, idx));
  });
}

// predefined variables
addDataToPrimEnv("empty", R_EMPTY_LIST);
addDataToPrimEnv("true", R_TRUE);
addDataToPrimEnv("false", R_FALSE);

// constants
addDataToPrimEnv("e", RPC_E);
addDataToPrimEnv("pi", RPC_PI);
addDataToPrimEnv("null", R_NULL);

// numbers
addFnToPrimEnv(new RPFMultiply());
addFnToPrimEnv(new RPFPlus());
addFnToPrimEnv(new RPFMinus());
addFnToPrimEnv(new RPFDivide());
addFnToPrimEnv(new RPFLess());
addFnToPrimEnv(new RPFLessThan());
addFnToPrimEnv(new RPFEqual());
addFnToPrimEnv(new RPFGreater());
addFnToPrimEnv(new RPFGreaterThan());
addFnToPrimEnv(new RPFAbs());
addFnToPrimEnv(new RPFAdd1());
addFnToPrimEnv(new RPFRandom());
addFnToPrimEnv(new RPFSub1());
addFnToPrimEnv(new RPFIsZero());

// booleans
addFnToPrimEnv(new RPFBooleanToString());
addFnToPrimEnv(new RPFAreBooleansEqual());
addFnToPrimEnv(new RPFIsBoolean());
addFnToPrimEnv(new RPFIsFalse());
addFnToPrimEnv(new RPFNot());

// symbols
addFnToPrimEnv(new RPFSymbolToString());
addFnToPrimEnv(new RPFAreSymbolsEqual());
addFnToPrimEnv(new RPFIsSymbol());

// lists
addFnToPrimEnv(new RPFAppend());
addFnToPrimEnv(new RPFCons());
addFnToPrimEnv(new RPFIsEmpty());
addFnToPrimEnv(new RPFList());

// posns
addStructToPrimEnv("posn", ["x", "y"]);

// misc
addFnToPrimEnv(new RPFAreEq());
addFnToPrimEnv(new RPFAreEqual());
addFnToPrimEnv(new RPFAreEqv());
addFnToPrimEnv(new RPFIdentity());
addFnToPrimEnv(new RPFIsStruct());
