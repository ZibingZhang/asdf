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
  RPFEvenHuh,
  RPFExactToInexact,
  RPFExp,
  RPFExpt,
  RPFFloor,
  RPFGreater,
  RPFGreaterThan,
  RPFInexactHuh,
  RPFInexactToExact,
  RPFIntegerHuh,
  RPFLess,
  RPFLessThan,
  RPFMax,
  RPFMin,
  RPFMinus,
  RPFModulo,
  RPFMultiply,
  RPFNegativeHuh,
  RPFNumberHuh,
  RPFNumberToString,
  RPFNumerator,
  RPFOddHuh,
  RPFPlus,
  RPFPositiveHuh,
  RPFQuotient,
  RPFRandom,
  RPFRemainder,
  RPFRound,
  RPFSqr,
  RPFSqrt,
  RPFSub1,
  RPFZeroHuh
} from "./primitive/numbers";
import {
  RPFAppend,
  RPFCar,
  RPFCdr,
  RPFCons,
  RPFEighth,
  RPFEmptyHuh,
  RPFFifth,
  RPFFirst,
  RPFFourth,
  RPFLength,
  RPFList,
  RPFListHuh,
  RPFListStar,
  RPFMakeList,
  RPFMember,
  RPFRemove,
  RPFRemoveAll,
  RPFRest,
  RPFReverse,
  RPFSecond,
  RPFSeventh,
  RPFSixth,
  RPFThird,
  R_NULL
} from "./primitive/lists";
import {
  RPFAreBooleansEqual,
  RPFBooleanHuh,
  RPFBooleanToString,
  RPFFalseHuh,
  RPFNot
} from "./primitive/booleans";
import {
  RPFAreEq,
  RPFAreEqual,
  RPFAreEqualWithin,
  RPFAreEqv,
  RPFError,
  RPFIdentity,
  RPFStructHuh
} from "./primitive/misc";
import {
  RPFAreSymbolsEqual,
  RPFSymbolHuh,
  RPFSymbolToString
} from "./primitive/symbols";
import {
  RPFStringDowncase,
  RPFStringHuh,
  RPFStringLength,
  RPFStringLessEqualThanHuh
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
PRIMITIVE_TEST_FUNCTIONS.set("check-range", { arity: 3 });
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
addFnToPrimEnv(new RPFEvenHuh());
addFnToPrimEnv(new RPFExactToInexact());
addFnToPrimEnv(new RPFFloor());
addFnToPrimEnv(new RPFExp());
addFnToPrimEnv(new RPFExpt());
addFnToPrimEnv(new RPFInexactToExact());
addFnToPrimEnv(new RPFInexactHuh());
addFnToPrimEnv(new RPFIntegerHuh());
addFnToPrimEnv(new RPFMax());
addFnToPrimEnv(new RPFMin());
addFnToPrimEnv(new RPFModulo());
addFnToPrimEnv(new RPFNegativeHuh());
addFnToPrimEnv(new RPFNumberToString());
addFnToPrimEnv(new RPFNumberHuh());
addFnToPrimEnv(new RPFNumerator());
addFnToPrimEnv(new RPFOddHuh());
addFnToPrimEnv(new RPFPositiveHuh());
addFnToPrimEnv(new RPFQuotient());
addFnToPrimEnv(new RPFRandom());
addFnToPrimEnv(new RPFRemainder());
addFnToPrimEnv(new RPFRound());
addFnToPrimEnv(new RPFNumberHuh("rational?"));
addFnToPrimEnv(new RPFNumberHuh("real?"));
addFnToPrimEnv(new RPFSqr());
addFnToPrimEnv(new RPFSqrt());
addFnToPrimEnv(new RPFSub1());
addFnToPrimEnv(new RPFZeroHuh());

// booleans
addFnToPrimEnv(new RPFBooleanToString());
addFnToPrimEnv(new RPFAreBooleansEqual());
addFnToPrimEnv(new RPFBooleanHuh());
addFnToPrimEnv(new RPFFalseHuh());
addFnToPrimEnv(new RPFNot());

// symbols
addFnToPrimEnv(new RPFSymbolToString());
addFnToPrimEnv(new RPFAreSymbolsEqual());
addFnToPrimEnv(new RPFSymbolHuh());

// lists
addFnToPrimEnv(new RPFAppend());
addFnToPrimEnv(new RPFCar());
addFnToPrimEnv(new RPFCdr());
addFnToPrimEnv(new RPFCons());
addFnToPrimEnv(new RPFListHuh("cons?"));
addFnToPrimEnv(new RPFEighth());
addFnToPrimEnv(new RPFEmptyHuh());
addFnToPrimEnv(new RPFFifth());
addFnToPrimEnv(new RPFFirst());
addFnToPrimEnv(new RPFFourth());
addFnToPrimEnv(new RPFLength());
addFnToPrimEnv(new RPFList());
addFnToPrimEnv(new RPFListStar());
addFnToPrimEnv(new RPFListHuh());
addFnToPrimEnv(new RPFMakeList());
addFnToPrimEnv(new RPFMember());
addFnToPrimEnv(new RPFMember("member?"));
addFnToPrimEnv(new RPFEmptyHuh("null?"));
addFnToPrimEnv(new RPFRemove());
addFnToPrimEnv(new RPFRemoveAll());
addFnToPrimEnv(new RPFRest());
addFnToPrimEnv(new RPFReverse());
addFnToPrimEnv(new RPFSecond());
addFnToPrimEnv(new RPFSeventh());
addFnToPrimEnv(new RPFSixth());
addFnToPrimEnv(new RPFThird());

// posns
addStructToPrimEnv("posn", ["x", "y"]);

// strings
addFnToPrimEnv(new RPFStringDowncase());
addFnToPrimEnv(new RPFStringLength());
addFnToPrimEnv(new RPFStringLessEqualThanHuh());
addFnToPrimEnv(new RPFStringHuh());

// misc
addFnToPrimEnv(new RPFAreEq());
addFnToPrimEnv(new RPFAreEqual());
addFnToPrimEnv(new RPFAreEqualWithin());
addFnToPrimEnv(new RPFAreEqv());
addFnToPrimEnv(new RPFError());
addFnToPrimEnv(new RPFIdentity());
addFnToPrimEnv(new RPFStructHuh());
