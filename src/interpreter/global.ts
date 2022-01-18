import {
  RData,
  RIsStructFun,
  RMakeStructFun,
  RPrimFun,
  RPrimTestFunConfig,
  RProcedure,
  RStructGetFun,
  RStructType,
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
  RPFCurrentSeconds,
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
  RPFAndmap,
  RPFApply,
  RPFArgmax,
  RPFArgmin,
  RPFBuildList,
  RPFFilter,
  RPFMap,
  RPFMemf,
  RPFOrmap,
  RPFProcedureHuh,
  RPFSort
} from "./primitive/higherOrder";
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
  RPFStringEqualHuh,
  RPFStringHuh,
  RPFStringLength,
  RPFStringLessEqualThanHuh
} from "./primitive/string";
import {
  Scope,
  VariableType
} from "./scope";
import {
  Environment
} from "./environment";
import {
  Keyword
} from "./keyword";

export {
  Global
};

class Global {
  primitiveScope: Scope;
  primitiveRelaxedScope: Scope;
  primitiveEnvironment: Environment;
  primitiveDataNames: Set<string>;
  primitiveStructNames: Set<string>;
  primitiveFunctions: Map<string, RProcedure>;
  primitiveTestFunctions: Map<string, RPrimTestFunConfig>;

  private static instance: Global;
  private higherOrderFunctions = new Set([
    new RPFAndmap(),
    new RPFApply(),
    new RPFArgmax(),
    new RPFArgmin(),
    new RPFBuildList(),
    new RPFFilter(),
    new RPFMap(),
    new RPFMemf(),
    new RPFOrmap(),
    new RPFProcedureHuh(),
    new RPFSort()
  ]);

  constructor() {
    if (Global.instance) {
      return Global.instance;
    }
    Global.instance = this;

    this.primitiveScope = new Scope();
    this.primitiveRelaxedScope = new Scope();
    this.primitiveEnvironment = new Environment();
    this.primitiveDataNames = new Set();
    this.primitiveStructNames = new Set();
    this.primitiveFunctions = new Map();
    this.primitiveTestFunctions = new Map();

    this.primitiveTestFunctions.set(Keyword.CheckError, { minArity: 1, maxArity: 2 });
    this.primitiveTestFunctions.set(Keyword.CheckExpect, { arity: 2 });
    this.primitiveTestFunctions.set(Keyword.CheckMemberOf, { minArity: 2 });
    this.primitiveTestFunctions.set(Keyword.CheckRandom, { arity: 2 });
    this.primitiveTestFunctions.set(Keyword.CheckRange, { arity: 3 });
    this.primitiveTestFunctions.set(Keyword.CheckSatisfied, { arity: 2 });
    this.primitiveTestFunctions.set(Keyword.CheckWithin, { arity: 3 });

    // predefined variables
    this.addDataToPrimEnv("empty", R_EMPTY_LIST);
    this.addDataToPrimEnv("true", R_TRUE);
    this.addDataToPrimEnv("false", R_FALSE);

    // numbers
    this.addFnToPrimEnv(new RPFMultiply());
    this.addFnToPrimEnv(new RPFPlus());
    this.addFnToPrimEnv(new RPFMinus());
    this.addFnToPrimEnv(new RPFDivide());
    this.addFnToPrimEnv(new RPFLess());
    this.addFnToPrimEnv(new RPFLessThan());
    this.addFnToPrimEnv(new RPFEqual());
    this.addFnToPrimEnv(new RPFGreater());
    this.addFnToPrimEnv(new RPFGreaterThan());
    this.addFnToPrimEnv(new RPFAbs());
    this.addFnToPrimEnv(new RPFAdd1());
    this.addFnToPrimEnv(new RPFCeiling());
    this.addFnToPrimEnv(new RPFCurrentSeconds());
    this.addFnToPrimEnv(new RPFDenominator());
    this.addFnToPrimEnv(new RPFEvenHuh());
    this.addFnToPrimEnv(new RPFExactToInexact());
    this.addDataToPrimEnv("e", RPC_E);
    this.addFnToPrimEnv(new RPFExp());
    this.addFnToPrimEnv(new RPFExpt());
    this.addFnToPrimEnv(new RPFFloor());
    this.addFnToPrimEnv(new RPFInexactToExact());
    this.addFnToPrimEnv(new RPFInexactHuh());
    this.addFnToPrimEnv(new RPFIntegerHuh());
    this.addFnToPrimEnv(new RPFMax());
    this.addFnToPrimEnv(new RPFMin());
    this.addFnToPrimEnv(new RPFModulo());
    this.addFnToPrimEnv(new RPFNegativeHuh());
    this.addFnToPrimEnv(new RPFNumberToString());
    this.addFnToPrimEnv(new RPFNumberHuh());
    this.addFnToPrimEnv(new RPFNumerator());
    this.addFnToPrimEnv(new RPFOddHuh());
    this.addDataToPrimEnv("pi", RPC_PI);
    this.addFnToPrimEnv(new RPFPositiveHuh());
    this.addFnToPrimEnv(new RPFQuotient());
    this.addFnToPrimEnv(new RPFRandom());
    this.addFnToPrimEnv(new RPFRemainder());
    this.addFnToPrimEnv(new RPFNumberHuh("rational?"));
    this.addFnToPrimEnv(new RPFNumberHuh("real?"));
    this.addFnToPrimEnv(new RPFRound());
    this.addFnToPrimEnv(new RPFSqr());
    this.addFnToPrimEnv(new RPFSqrt());
    this.addFnToPrimEnv(new RPFSub1());
    this.addFnToPrimEnv(new RPFZeroHuh());

    // booleans
    this.addFnToPrimEnv(new RPFBooleanToString());
    this.addFnToPrimEnv(new RPFAreBooleansEqual());
    this.addFnToPrimEnv(new RPFBooleanHuh());
    this.addFnToPrimEnv(new RPFFalseHuh());
    this.addFnToPrimEnv(new RPFNot());

    // symbols
    this.addFnToPrimEnv(new RPFSymbolToString());
    this.addFnToPrimEnv(new RPFAreSymbolsEqual());
    this.addFnToPrimEnv(new RPFSymbolHuh());

    // lists
    this.addFnToPrimEnv(new RPFAppend());
    this.addFnToPrimEnv(new RPFCar());
    this.addFnToPrimEnv(new RPFCdr());
    this.addFnToPrimEnv(new RPFCons());
    this.addFnToPrimEnv(new RPFListHuh("cons?"));
    this.addFnToPrimEnv(new RPFEighth());
    this.addFnToPrimEnv(new RPFEmptyHuh());
    this.addFnToPrimEnv(new RPFFifth());
    this.addFnToPrimEnv(new RPFFirst());
    this.addFnToPrimEnv(new RPFFourth());
    this.addFnToPrimEnv(new RPFLength());
    this.addFnToPrimEnv(new RPFList());
    this.addFnToPrimEnv(new RPFListStar());
    this.addFnToPrimEnv(new RPFListHuh());
    this.addFnToPrimEnv(new RPFMakeList());
    this.addFnToPrimEnv(new RPFMember());
    this.addFnToPrimEnv(new RPFMember("member?"));
    this.addDataToPrimEnv("null", R_NULL);
    this.addFnToPrimEnv(new RPFEmptyHuh("null?"));
    this.addFnToPrimEnv(new RPFRemove());
    this.addFnToPrimEnv(new RPFRemoveAll());
    this.addFnToPrimEnv(new RPFRest());
    this.addFnToPrimEnv(new RPFReverse());
    this.addFnToPrimEnv(new RPFSecond());
    this.addFnToPrimEnv(new RPFSeventh());
    this.addFnToPrimEnv(new RPFSixth());
    this.addFnToPrimEnv(new RPFThird());

    // posns
    this.addStructToPrimEnv("posn", ["x", "y"]);

    // strings
    this.addFnToPrimEnv(new RPFStringDowncase());
    this.addFnToPrimEnv(new RPFStringLength());
    this.addFnToPrimEnv(new RPFStringLessEqualThanHuh());
    this.addFnToPrimEnv(new RPFStringEqualHuh());
    this.addFnToPrimEnv(new RPFStringHuh());

    // misc
    this.addFnToPrimEnv(new RPFAreEq());
    this.addFnToPrimEnv(new RPFAreEqual());
    this.addFnToPrimEnv(new RPFAreEqualWithin());
    this.addFnToPrimEnv(new RPFAreEqv());
    this.addFnToPrimEnv(new RPFError());
    this.addFnToPrimEnv(new RPFIdentity());
    this.addFnToPrimEnv(new RPFStructHuh());

    this.defineScopes();
  }

  enableHigherOrderFunctions() {
    // higher-order
    this.higherOrderFunctions.forEach(fn => this.addFnToPrimEnv(fn));
    this.defineScopes();
  }

  disableHigherOrderFunctions() {
    this.higherOrderFunctions.forEach(fn => {
      this.primitiveEnvironment.delete(fn.name);
      this.primitiveFunctions.delete(fn.name);
    });
    this.defineScopes();
  }

  private addDataToPrimEnv(name: string, val: RData) {
    this.primitiveEnvironment.set(name, val);
    this.primitiveDataNames.add(name);
  }

  private addFnToPrimEnv(val: RPrimFun) {
    this.primitiveEnvironment.set(val.name, val);
    this.primitiveFunctions.set(val.name, val);
  }

  private addStructToPrimEnv(name: string, fields: string[]) {
    const structType = new RStructType(name);
    const makeStructFun = new RMakeStructFun(name, fields.length);
    const isStructFun = new RIsStructFun(name);
    const structGetFuns = fields.map((field, idx) => new RStructGetFun(name, field, idx));
    this.primitiveEnvironment.set(name, structType);
    this.primitiveEnvironment.set(`make-${name}`, makeStructFun);
    this.primitiveEnvironment.set(`${name}?`, isStructFun);
    structGetFuns.forEach(fun => {
      this.primitiveEnvironment.set(`${name}-${fun.fieldName}`, fun);
    });
    this.primitiveStructNames.add(name);
    this.primitiveFunctions.set(`make-${name}`, makeStructFun);
    this.primitiveFunctions.set(`${name}?`, isStructFun);
    structGetFuns.forEach(fun => {
      this.primitiveFunctions.set(`${name}-${fun.fieldName}`, fun);
    });
  }

  private defineScopes() {
    this.primitiveDataNames.forEach((name) => this.primitiveScope.set(name, VariableType.Data));
    this.primitiveFunctions.forEach((callable, name) => {
      if (callable.config.relaxedMinArity !== undefined) {
        this.primitiveRelaxedScope.set(name, VariableType.PrimitiveFunction);
      }
      this.primitiveScope.set(name, VariableType.PrimitiveFunction);
    });
    this.primitiveStructNames.forEach((name) => this.primitiveScope.set(name, VariableType.StructureType));
  }
}
