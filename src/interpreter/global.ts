import {
  RData,
  RMakeStructFun,
  RModule,
  RPrimProc,
  RPrimTestFunConfig,
  RProcedure,
  RStructGetProc,
  RStructHuhProc,
  RStructType,
  R_EMPTY_LIST,
  R_FALSE,
  R_TRUE
} from "./values/rvalue";
import {
  RPC_E,
  RPC_PI,
  RPPAbs,
  RPPAdd1,
  RPPCeiling,
  RPPCurrentSeconds,
  RPPDenominator,
  RPPDivide,
  RPPEqual,
  RPPEvenHuh,
  RPPExactToInexact,
  RPPExp,
  RPPExpt,
  RPPFloor,
  RPPGreater,
  RPPGreaterEqual,
  RPPInexactHuh,
  RPPInexactToExact,
  RPPIntegerHuh,
  RPPLess,
  RPPLessEqual,
  RPPMax,
  RPPMin,
  RPPMinus,
  RPPModulo,
  RPPMultiply,
  RPPNegativeHuh,
  RPPNumberHuh,
  RPPNumberToString,
  RPPNumerator,
  RPPOddHuh,
  RPPPlus,
  RPPPositiveHuh,
  RPPQuotient,
  RPPRandom,
  RPPRemainder,
  RPPRound,
  RPPSgn,
  RPPSqr,
  RPPSqrt,
  RPPSub1,
  RPPZeroHuh
} from "./primitive/numbers";
import {
  RPC_EOF,
  RPPAreEq,
  RPPAreEqual,
  RPPAreEqualWithin,
  RPPAreEqv,
  RPPAreWithin,
  RPPEofObjectHuh,
  RPPError,
  RPPIdentity,
  RPPStructHuh
} from "./primitive/misc";
import {
  RPPAndmap,
  RPPApply,
  RPPArgmax,
  RPPArgmin,
  RPPBuildList,
  RPPCompose,
  RPPFilter,
  RPPFoldl,
  RPPFoldr,
  RPPMap,
  RPPMemf,
  RPPOrmap,
  RPPProcedureHuh,
  RPPSort
} from "./primitive/higherOrder";
import {
  RPPAppend,
  RPPCar,
  RPPCdr,
  RPPCons,
  RPPEighth,
  RPPEmptyHuh,
  RPPFifth,
  RPPFirst,
  RPPFourth,
  RPPLength,
  RPPList,
  RPPListHuh,
  RPPListStar,
  RPPMakeList,
  RPPMember,
  RPPRemove,
  RPPRemoveAll,
  RPPRest,
  RPPReverse,
  RPPSecond,
  RPPSeventh,
  RPPSixth,
  RPPThird,
  R_NULL
} from "./primitive/lists";
import {
  RPPAreBooleansEqual,
  RPPBooleanHuh,
  RPPBooleanToString,
  RPPFalseHuh,
  RPPNot
} from "./primitive/booleans";
import {
  RPPAreSymbolsEqual,
  RPPSymbolHuh,
  RPPSymbolToString
} from "./primitive/symbols";
import {
  RPPCharAlphabeticHuh,
  RPPCharToInteger
} from "./primitive/characters";
import {
  RPPExplode,
  RPPMakeString,
  RPPReplicate,
  RPPString,
  RPPStringAlphabeticHuh,
  RPPStringAppend,
  RPPStringCiEqualHuh,
  RPPStringCiGreaterEqualHuh,
  RPPStringCiGreaterHuh,
  RPPStringCiLessEqualHuh,
  RPPStringCiLessHuh,
  RPPStringContainsCiHuh,
  RPPStringContainsHuh,
  RPPStringCopy,
  RPPStringDowncase,
  RPPStringEqualHuh,
  RPPStringGreaterEqualHuh,
  RPPStringGreaterHuh,
  RPPStringHuh,
  RPPStringLength,
  RPPStringLessEqualHuh,
  RPPStringLessHuh,
  RPPStringLowerCaseHuh,
  RPPStringNumericHuh,
  RPPStringToSymbol,
  RPPStringUpcase,
  RPPStringUpperCaseHuh
} from "./primitive/string";
import {
  Scope,
  VariableType
} from "./data/scope";
import {
  Environment
} from "./data/environment";
import {
  Keyword
} from "./data/keyword";
import {
  R2HtdpImageModule
} from "./modules/2htdp/image/module";
import {
  R2HtdpUniverseModule
} from "./modules/2htdp/universe/module";

export {
  Global
};

class Global {
  primitiveScope: Scope;
  primitiveRelaxedScope: Scope;
  primitiveEnvironment: Environment;
  primitiveDataNames: Set<string>;
  primitiveStructNames: Set<string>;
  primitiveProcedures: Map<string, RProcedure>;
  primitiveTestFunctions: Map<string, RPrimTestFunConfig>;
  modules: Map<string, RModule>;

  private static instance: Global;
  private higherOrderFunctions = new Set([
    new RPPAndmap(),
    new RPPApply(),
    new RPPArgmax(),
    new RPPArgmin(),
    new RPPBuildList(),
    new RPPCompose(),
    new RPPFilter(),
    new RPPFoldl(),
    new RPPFoldr(),
    new RPPMap(),
    new RPPMemf(),
    new RPPOrmap(),
    new RPPProcedureHuh(),
    new RPPSort()
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
    this.primitiveProcedures = new Map();
    this.primitiveTestFunctions = new Map();
    this.modules = new Map();

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
    this.addFnToPrimEnv(new RPPMultiply());
    this.addFnToPrimEnv(new RPPPlus());
    this.addFnToPrimEnv(new RPPMinus());
    this.addFnToPrimEnv(new RPPDivide());
    this.addFnToPrimEnv(new RPPLess());
    this.addFnToPrimEnv(new RPPLessEqual());
    this.addFnToPrimEnv(new RPPEqual());
    this.addFnToPrimEnv(new RPPGreater());
    this.addFnToPrimEnv(new RPPGreaterEqual());
    this.addFnToPrimEnv(new RPPAbs());
    this.addFnToPrimEnv(new RPPAdd1());
    this.addFnToPrimEnv(new RPPCeiling());
    this.addFnToPrimEnv(new RPPCurrentSeconds());
    this.addFnToPrimEnv(new RPPDenominator());
    this.addFnToPrimEnv(new RPPEvenHuh());
    this.addFnToPrimEnv(new RPPExactToInexact());
    this.addDataToPrimEnv("e", RPC_E);
    this.addFnToPrimEnv(new RPPExp());
    this.addFnToPrimEnv(new RPPExpt());
    this.addFnToPrimEnv(new RPPFloor());
    this.addFnToPrimEnv(new RPPInexactToExact());
    this.addFnToPrimEnv(new RPPInexactHuh());
    this.addFnToPrimEnv(new RPPIntegerHuh());
    this.addFnToPrimEnv(new RPPMax());
    this.addFnToPrimEnv(new RPPMin());
    this.addFnToPrimEnv(new RPPModulo());
    this.addFnToPrimEnv(new RPPNegativeHuh());
    this.addFnToPrimEnv(new RPPNumberToString());
    this.addFnToPrimEnv(new RPPNumberHuh());
    this.addFnToPrimEnv(new RPPNumerator());
    this.addFnToPrimEnv(new RPPOddHuh());
    this.addDataToPrimEnv("pi", RPC_PI);
    this.addFnToPrimEnv(new RPPPositiveHuh());
    this.addFnToPrimEnv(new RPPQuotient());
    this.addFnToPrimEnv(new RPPRandom());
    this.addFnToPrimEnv(new RPPRemainder());
    this.addFnToPrimEnv(new RPPNumberHuh("rational?"));
    this.addFnToPrimEnv(new RPPNumberHuh("real?"));
    this.addFnToPrimEnv(new RPPRound());
    this.addFnToPrimEnv(new RPPSgn());
    this.addFnToPrimEnv(new RPPSqr());
    this.addFnToPrimEnv(new RPPSqrt());
    this.addFnToPrimEnv(new RPPSub1());
    this.addFnToPrimEnv(new RPPZeroHuh());

    // booleans
    this.addFnToPrimEnv(new RPPBooleanToString());
    this.addFnToPrimEnv(new RPPAreBooleansEqual());
    this.addFnToPrimEnv(new RPPBooleanHuh());
    this.addFnToPrimEnv(new RPPFalseHuh());
    this.addFnToPrimEnv(new RPPNot());

    // symbols
    this.addFnToPrimEnv(new RPPSymbolToString());
    this.addFnToPrimEnv(new RPPAreSymbolsEqual());
    this.addFnToPrimEnv(new RPPSymbolHuh());

    // lists
    this.addFnToPrimEnv(new RPPAppend());
    this.addFnToPrimEnv(new RPPCar());
    this.addFnToPrimEnv(new RPPCdr());
    this.addFnToPrimEnv(new RPPCons());
    this.addFnToPrimEnv(new RPPListHuh("cons?"));
    this.addFnToPrimEnv(new RPPEighth());
    this.addFnToPrimEnv(new RPPEmptyHuh());
    this.addFnToPrimEnv(new RPPFifth());
    this.addFnToPrimEnv(new RPPFirst());
    this.addFnToPrimEnv(new RPPFourth());
    this.addFnToPrimEnv(new RPPLength());
    this.addFnToPrimEnv(new RPPList());
    this.addFnToPrimEnv(new RPPListStar());
    this.addFnToPrimEnv(new RPPListHuh());
    this.addFnToPrimEnv(new RPPMakeList());
    this.addFnToPrimEnv(new RPPMember());
    this.addFnToPrimEnv(new RPPMember("member?"));
    this.addDataToPrimEnv("null", R_NULL);
    this.addFnToPrimEnv(new RPPEmptyHuh("null?"));
    this.addFnToPrimEnv(new RPPRemove());
    this.addFnToPrimEnv(new RPPRemoveAll());
    this.addFnToPrimEnv(new RPPRest());
    this.addFnToPrimEnv(new RPPReverse());
    this.addFnToPrimEnv(new RPPSecond());
    this.addFnToPrimEnv(new RPPSeventh());
    this.addFnToPrimEnv(new RPPSixth());
    this.addFnToPrimEnv(new RPPThird());

    // posns
    this.addStructToPrimEnv("posn", ["x", "y"]);

    // characters
    this.addFnToPrimEnv(new RPPCharToInteger());
    this.addFnToPrimEnv(new RPPCharAlphabeticHuh());

    // strings
    this.addFnToPrimEnv(new RPPExplode());
    this.addFnToPrimEnv(new RPPMakeString());
    this.addFnToPrimEnv(new RPPReplicate());
    this.addFnToPrimEnv(new RPPString());
    this.addFnToPrimEnv(new RPPStringToSymbol());
    this.addFnToPrimEnv(new RPPStringAlphabeticHuh());
    this.addFnToPrimEnv(new RPPStringAppend());
    this.addFnToPrimEnv(new RPPStringCiLessEqualHuh());
    this.addFnToPrimEnv(new RPPStringCiLessHuh());
    this.addFnToPrimEnv(new RPPStringCiEqualHuh());
    this.addFnToPrimEnv(new RPPStringCiGreaterEqualHuh());
    this.addFnToPrimEnv(new RPPStringCiGreaterHuh());
    this.addFnToPrimEnv(new RPPStringContainsCiHuh());
    this.addFnToPrimEnv(new RPPStringContainsHuh());
    this.addFnToPrimEnv(new RPPStringCopy());
    this.addFnToPrimEnv(new RPPStringDowncase());
    this.addFnToPrimEnv(new RPPStringLength());
    this.addFnToPrimEnv(new RPPStringLowerCaseHuh());
    this.addFnToPrimEnv(new RPPStringNumericHuh());
    this.addFnToPrimEnv(new RPPStringUpcase());
    this.addFnToPrimEnv(new RPPStringUpperCaseHuh());
    this.addFnToPrimEnv(new RPPStringLessEqualHuh());
    this.addFnToPrimEnv(new RPPStringLessHuh());
    this.addFnToPrimEnv(new RPPStringEqualHuh());
    this.addFnToPrimEnv(new RPPStringGreaterEqualHuh());
    this.addFnToPrimEnv(new RPPStringGreaterHuh());
    this.addFnToPrimEnv(new RPPStringHuh());

    // misc
    this.addFnToPrimEnv(new RPPAreWithin());
    this.addDataToPrimEnv("eof", RPC_EOF);
    this.addFnToPrimEnv(new RPPEofObjectHuh());
    this.addFnToPrimEnv(new RPPAreEq());
    this.addFnToPrimEnv(new RPPAreEqual());
    this.addFnToPrimEnv(new RPPAreEqualWithin());
    this.addFnToPrimEnv(new RPPAreEqv());
    this.addFnToPrimEnv(new RPPError());
    this.addFnToPrimEnv(new RPPIdentity());
    this.addFnToPrimEnv(new RPPStructHuh());

    this.defineScopes();

    // modules
    this.addModule(R2HtdpImageModule);
    this.addModule(R2HtdpUniverseModule);
  }

  enableHigherOrderFunctions() {
    this.higherOrderFunctions.forEach(fn => this.addFnToPrimEnv(fn));
    this.defineScopes();
  }

  disableHigherOrderFunctions() {
    this.higherOrderFunctions.forEach(fn => this.deleteFnFormPrimEnv(fn));
    this.defineScopes();
  }

  private addDataToPrimEnv(name: string, rval: RData) {
    this.primitiveEnvironment.set(name, rval);
    this.primitiveDataNames.add(name);
  }

  private addFnToPrimEnv(rval: RPrimProc) {
    this.primitiveEnvironment.set(rval.name, rval);
    this.primitiveProcedures.set(rval.name, rval);
  }

  private deleteFnFormPrimEnv(rval: RPrimProc) {
    this.primitiveEnvironment.delete(rval.name);
    this.primitiveProcedures.delete(rval.name);
  }

  private addStructToPrimEnv(name: string, fields: string[]) {
    const structType = new RStructType(name);
    const makeStructFun = new RMakeStructFun(name, fields.length);
    const isStructFun = new RStructHuhProc(name);
    const structGetFuns = fields.map((field, idx) => new RStructGetProc(name, field, idx));
    this.primitiveEnvironment.set(name, structType);
    this.primitiveEnvironment.set(`make-${name}`, makeStructFun);
    this.primitiveEnvironment.set(`${name}?`, isStructFun);
    structGetFuns.forEach(fun => {
      this.primitiveEnvironment.set(`${name}-${fun.fieldName}`, fun);
    });
    this.primitiveStructNames.add(name);
    this.primitiveProcedures.set(`make-${name}`, makeStructFun);
    this.primitiveProcedures.set(`${name}?`, isStructFun);
    structGetFuns.forEach(fun => {
      this.primitiveProcedures.set(`${name}-${fun.fieldName}`, fun);
    });
  }

  private defineScopes() {
    this.primitiveDataNames.forEach((name) => this.primitiveScope.set(name, VariableType.Data));
    this.primitiveProcedures.forEach((procedure, name) => {
      if (procedure.config.relaxedMinArity !== undefined) {
        this.primitiveRelaxedScope.set(name, VariableType.PrimitiveFunction);
      }
      this.primitiveScope.set(name, VariableType.PrimitiveFunction);
    });
    this.primitiveStructNames.forEach((name) => this.primitiveScope.set(name, VariableType.StructureType));
  }

  private addModule(rval: RModule) {
    this.modules.set(rval.name, rval);
  }
}
