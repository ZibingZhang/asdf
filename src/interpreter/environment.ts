import {
  RData,
  RIsStructFun,
  RMakeStructFun,
  RPrimFun,
  RPrimFunConfig,
  RStructGetFun,
  RStructType,
  RValue,
  R_EMPTY_LIST,
  R_FALSE,
  R_TRUE
} from "./rvalue";
import {
  RPC_E,
  RPC_PI,
  RPFAbs,
  RPFAdd1,
  RPFCeiling,
  RPFDenominator,
  RPFDivide,
  RPFEqual,
  RPFExactToInexact,
  RPFExp,
  RPFExpt,
  RPFFloor,
  RPFGreater,
  RPFGreaterThan,
  RPFInexactToExact,
  RPFIsEven,
  RPFIsInexact,
  RPFIsInteger,
  RPFIsNegative,
  RPFIsNumber,
  RPFIsOdd,
  RPFIsPositive,
  RPFIsZero,
  RPFLess,
  RPFLessThan,
  RPFMax,
  RPFMin,
  RPFMinus,
  RPFModulo,
  RPFMultiply,
  RPFNumberToString,
  RPFNumerator,
  RPFPlus,
  RPFQuotient,
  RPFRandom,
  RPFSqr,
  RPFSqrt,
  RPFSub1
} from "./primitive/numbers";
import {
  RPFAppend,
  RPFCar,
  RPFCdr,
  RPFCons,
  RPFFirst,
  RPFIsEmpty,
  RPFIsList,
  RPFList,
  RPFMember,
  RPFRest,
  R_NULL
} from "./primitive/lists";
import {
  RPFAreBooleansEqual,
  RPFBooleanToString,
  RPFIsBoolean,
  RPFIsFalse,
  RPFNot
} from "./primitive/booleans";
import {
  RPFAreEq,
  RPFAreEqual,
  RPFAreEqualWithin,
  RPFAreEqv,
  RPFIdentity,
  RPFIsStruct
} from "./primitive/misc";
import {
  RPFAreSymbolsEqual,
  RPFIsSymbol,
  RPFSymbolToString
} from "./primitive/symbols";
import {
  RPFIsString,
  RPFIsStringLessEqualThan,
  RPFStringDowncase,
  RPFStringLength
} from "./primitive/string";
import {
  SC_USED_BEFORE_DEFINITION_ERR
} from "./error";
import {
  SourceSpan
} from "./sourcespan";
import {
  StageError
} from "./pipeline";

export {
  PRIMITIVE_DATA_NAMES,
  PRIMITIVE_ENVIRONMENT,
  PRIMITIVE_FUNCTIONS,
  PRIMITIVE_STRUCT_NAMES,
  PRIMITIVE_TEST_FUNCTIONS,
  Environment
};

class Environment {
  parentEnv: Environment | undefined;
  private map: Map<string, RValue>;

  constructor(parentEnv?: Environment) {
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
const PRIMITIVE_STRUCT_NAMES: Set<string> = new Set();
const PRIMITIVE_FUNCTIONS: Map<string, RPrimFunConfig> = new Map();
const PRIMITIVE_TEST_FUNCTIONS: Map<string, RPrimFunConfig> = new Map();

PRIMITIVE_TEST_FUNCTIONS.set("check-error", { minArity: 1, maxArity: 2 });
PRIMITIVE_TEST_FUNCTIONS.set("check-expect", { arity: 2 });
PRIMITIVE_TEST_FUNCTIONS.set("check-member-of", { minArity: 2 });
PRIMITIVE_TEST_FUNCTIONS.set("check-random", { arity: 2 });
PRIMITIVE_TEST_FUNCTIONS.set("check-satisfied", { arity: 2 });
PRIMITIVE_TEST_FUNCTIONS.set("check-within", { arity: 3 });

function addDataToPrimEnv(name: string, val: RData) {
  PRIMITIVE_DATA_NAMES.add(name);
  PRIMITIVE_ENVIRONMENT.set(name, val);
}

function addFnToPrimEnv(val: RPrimFun) {
  PRIMITIVE_FUNCTIONS.set(val.name, val.config);
  PRIMITIVE_ENVIRONMENT.set(val.name, val);
}

function addStructToPrimEnv(name: string, fields: string[]) {
  PRIMITIVE_STRUCT_NAMES.add(name);
  PRIMITIVE_FUNCTIONS.set(`make-${name}`, { arity: fields.length });
  PRIMITIVE_FUNCTIONS.set(`${name}?`, { arity: 1 });
  fields.forEach((field) => {
    PRIMITIVE_FUNCTIONS.set(`${name}-${field}`, { arity: 1 });
  });
  PRIMITIVE_ENVIRONMENT.set(name, new RStructType(name));
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
addFnToPrimEnv(new RPFCeiling());
addFnToPrimEnv(new RPFDenominator());
addFnToPrimEnv(new RPFIsEven());
addFnToPrimEnv(new RPFExactToInexact());
addFnToPrimEnv(new RPFFloor());
addFnToPrimEnv(new RPFExp());
addFnToPrimEnv(new RPFExpt());
addFnToPrimEnv(new RPFInexactToExact());
addFnToPrimEnv(new RPFIsInexact());
addFnToPrimEnv(new RPFIsInteger());
addFnToPrimEnv(new RPFMax());
addFnToPrimEnv(new RPFMin());
addFnToPrimEnv(new RPFModulo());
addFnToPrimEnv(new RPFIsNegative());
addFnToPrimEnv(new RPFNumberToString());
addFnToPrimEnv(new RPFIsNumber());
addFnToPrimEnv(new RPFNumerator());
addFnToPrimEnv(new RPFIsOdd());
addFnToPrimEnv(new RPFIsPositive());
addFnToPrimEnv(new RPFQuotient());
addFnToPrimEnv(new RPFRandom());
addFnToPrimEnv(new RPFIsNumber("rational?"));
addFnToPrimEnv(new RPFIsNumber("real?"));
addFnToPrimEnv(new RPFSqr());
addFnToPrimEnv(new RPFSqrt());
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
addFnToPrimEnv(new RPFCar());
addFnToPrimEnv(new RPFCdr());
addFnToPrimEnv(new RPFCons());
addFnToPrimEnv(new RPFIsList("cons?"));
addFnToPrimEnv(new RPFIsEmpty());
addFnToPrimEnv(new RPFFirst());
addFnToPrimEnv(new RPFList());
addFnToPrimEnv(new RPFIsList());
addFnToPrimEnv(new RPFMember());
addFnToPrimEnv(new RPFMember("member?"));
addFnToPrimEnv(new RPFIsEmpty("null?"));
addFnToPrimEnv(new RPFRest());

// posns
addStructToPrimEnv("posn", ["x", "y"]);

// strings
addFnToPrimEnv(new RPFStringDowncase());
addFnToPrimEnv(new RPFStringLength());
addFnToPrimEnv(new RPFIsStringLessEqualThan());
addFnToPrimEnv(new RPFIsString());

// misc
addFnToPrimEnv(new RPFAreEq());
addFnToPrimEnv(new RPFAreEqual());
addFnToPrimEnv(new RPFAreEqualWithin());
addFnToPrimEnv(new RPFAreEqv());
addFnToPrimEnv(new RPFIdentity());
addFnToPrimEnv(new RPFIsStruct());
