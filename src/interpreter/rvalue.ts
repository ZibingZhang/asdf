/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ASTNode
} from "./ast.js";
import {
  Environment
} from "./environment.js";
import {
  NO_SOURCE_SPAN,
  SourceSpan
} from "./sourcespan.js";

export {
  R_EMPTY_LIST,
  R_FALSE,
  R_TRUE,
  R_VOID,
  RBoolean,
  RData,
  RExactReal,
  RInexactRational,
  RIsStructFun,
  RLambda,
  RList,
  RMakeStructFun,
  RMath,
  RNumber,
  RPrimFun,
  RPrimFunConfig,
  RString,
  RStruct,
  RStructGetFun,
  RStructType,
  RSymbol,
  RTestResult,
  RValue,
  TypeName,
  isRBoolean,
  isRCallable,
  isRData,
  isRDecimal,
  isREmptyList,
  isRExactPositiveInteger,
  isRFalse,
  isRInexact,
  isRInteger,
  isRList,
  isRPrimFun,
  isRString,
  isRStruct,
  isRSymbol,
  isRTrue,
  toRBoolean,
  RCallableVisitor
};

// https://stackoverflow.com/questions/17445231/js-how-to-find-the-greatest-common-divisor
function gcd(a: bigint, b: bigint): bigint {
  if (!b) {
    return a;
  }
  return gcd(b, a % b);
}

type RValue =
  | RCallable
  | RData
  | RTestResult;
type RCallable =
  | RIsStructFun
  | RMakeStructFun
  | RLambda
  | RPrimFun
  | RStructGetFun;
type RData =
  | RAtomic
  | RList
  | RStruct;
type RAtomic =
  | RBoolean
  | RNumber
  | RString
  | RStructType
  | RSymbol
  | RVoid;
type RNumber =
  | RExactReal
  | RInexact;
type RInexact =
  | RInexactDecimal
  | RInexactRational;

type RRational =
  | RExactReal
  | RInexactRational;

interface RValBase {
  stringify(): string;
}

class RTestResult implements RValBase {
  constructor(
    readonly passed: boolean,
    readonly msg: string = "",
    readonly sourceSpan: SourceSpan = NO_SOURCE_SPAN
  ) {}

  stringify(): string {
    throw "illegal state: cannot stringify a test result";
  }
}

abstract class RDataBase implements RValBase {
  abstract stringify(): string;

  abstract equalWithin(rval: RValue, ep: number): boolean;

  equal(rval: RValue): boolean {
    return this.equalWithin(rval, 0);
  }

  eqv(rval: RValue): boolean {
    return this.equal(rval);
  }

  eq(rval: RValue): boolean {
    return rval === this;
  }
}

class RBoolean extends RDataBase {
  constructor(readonly val: boolean) {
    super();
  }

  stringify(): string {
    return this.val ? "#true" : "#false";
  }

  equalWithin(rval: RValue, _: number): boolean {
    return isRBoolean(rval)
      && rval.val === this.val;
  }
}

class RList extends RDataBase {
  constructor(readonly vals: RValue[]) {
    super();
  }

  stringify(): string {
    if (this.vals.length === 0) {
      return "'()";
    } else {
      let output = `(cons ${this.vals[0].stringify()}`;
      for (const val of this.vals.slice(1)) {
        output += ` (cons ${val.stringify()}`;
      }
      output += " '()" + ")".repeat(this.vals.length);
      return output;
    }
  }

  equalWithin(rval: RValue, ep: number): boolean {
    return isRList(rval)
      && rval.vals.length === this.vals.length
      && rval.vals.every((rval, idx) => {
        const val = this.vals[idx];
        return isRData(rval)
          && isRData(val)
          && rval.equalWithin(val, ep);
      });
  }

  eqv(rval: RValue): boolean {
    return rval === this;
  }
}

class RString extends RDataBase {
  constructor(readonly val: string) {
    super();
  }

  stringify(): string {
    return `"${this.val}"`;
  }

  equalWithin(rval: RValue, _: number): boolean {
    return isRString(rval)
      && rval.val === this.val;
  }
}

class RStruct extends RDataBase {
  constructor(
    readonly name: string,
    readonly vals: RValue[]
  ) {
    super();
  }

  stringify(): string {
    if (this.vals.length === 0) {
      return `(make-${this.name})`;
    } else {
      return `(make-${this.name} ${this.vals.map(val => val.stringify()).join(" ")})`;
    }
  }

  equalWithin(rval: RValue, ep: number): boolean {
    return isRStruct(rval)
      && rval.name === this.name
      && rval.vals.every((rval, idx) => {
        const val = this.vals[idx];
        return isRData(rval)
          && isRData(val)
          && rval.equalWithin(val, ep);
      });
  }

  eqv(rval: RValue): boolean {
    return rval === this;
  }
}

class RStructType extends RDataBase {
  constructor(readonly name: string) {
    super();
  }

  stringify(): string {
    throw "illegal state: cannot stringify a structure type";
  }

  equalWithin(rval: RValue, _: number): boolean {
    return isRStructType(rval)
      && rval.name === this.name;
  }
}

class RSymbol extends RDataBase {
  constructor(readonly val: string) {
    super();
  }

  stringify(): string {
    return "'" + this.val;
  }

  equalWithin(rval: RValue, _: number): boolean {
    return isRSymbol(rval)
      && rval.val === this.val;
  }
}

class RVoid extends RDataBase {
  stringify(): string {
    return "(void)";
  }

  equalWithin(rval: RValue, _: number): boolean {
    return isRVoid(rval);
  }
}

abstract class RNumberBase extends RDataBase {
  equalWithin(rval: RValue, ep: number): boolean {
    return isRNumber(rval)
      && this.within(rval, ep);
  }

  within(that: RNumber, ep: number): boolean {
    return Math.abs(this.toInexactDecimal().val - that.toInexactDecimal().val) <= ep;
  }

  abstract negate(): RNumber;

  abstract isZero(): boolean;

  abstract isNegative(): boolean;

  abstract toInexactDecimal(): RInexactDecimal;

  abstract stringify(): string;
}

class RExactReal extends RNumberBase {
  constructor(
    readonly numerator: bigint,
    readonly denominator: bigint = 1n
  ) {
    super();
    if ((numerator < 0 && denominator < 0) || (numerator > 0 && denominator > 0)) {
      const divisor = gcd(numerator, denominator);
      this.numerator = numerator / divisor;
      this.denominator = denominator / divisor;
    } else {
      const divisor = gcd(-1n * numerator, denominator);
      this.numerator = numerator / divisor;
      this.denominator = denominator / divisor;
    }
  }

  stringify(): string {
    if (this.denominator === 1n) {
      return this.numerator.toString();
    } else {
      const flooredValue = this.numerator / this.denominator;
      return `${flooredValue}${(Number(this.numerator - flooredValue * this.denominator) / Number(this.denominator)).toString().slice(1)}`;
    }
  }

  equal(rval: RValue): boolean {
    return isRExactReal(rval)
      && rval.numerator === this.numerator
      && rval.denominator === this.denominator;
  }

  negate(): RExactReal {
    return new RExactReal(-1n * this.numerator, this.denominator);
  }

  isZero(): boolean {
    return this.numerator === 0n;
  }

  isNegative(): boolean {
    return this.numerator < 0;
  }

  toInexactDecimal(): RInexactDecimal {
    return new RInexactDecimal(Number(this.numerator) / Number(this.denominator));
  }
}

class RInexactDecimal extends RNumberBase {
  constructor(readonly val: number) {
    super();
  }

  stringify(): string {
    return `#i${this.val}`;
  }

  equal(rval: RValue): boolean {
    return isRInexactDecimal(rval)
      && rval.val === this.val;
  }

  negate(): RInexactDecimal {
    return new RInexactDecimal(-1 * this.val);
  }

  isZero(): boolean {
    return this.val === 0;
  }

  isNegative(): boolean {
    return this.val < 0;
  }

  toInexactDecimal(): RInexactDecimal {
    return this;
  }
}

class RInexactRational extends RNumberBase {
  constructor(
    readonly numerator: bigint,
    readonly denominator: bigint
  ) {
    super();
    if ((numerator < 0 && denominator < 0) || (numerator > 0 && denominator > 0)) {
      const divisor = gcd(numerator, denominator);
      this.numerator = numerator / divisor;
      this.denominator = denominator / divisor;
    } else {
      const divisor = gcd(-1n * numerator, denominator);
      this.numerator = numerator / divisor;
      this.denominator = denominator / divisor;
    }
  }

  stringify(): string {
    if (this.denominator === 1n) {
      return `#i${this.numerator.toString()}`;
    } else {
      const flooredValue = this.numerator / this.denominator;
      return `#i${flooredValue}${(Number(this.numerator - flooredValue * this.denominator) / Number(this.denominator)).toString().slice(1)}`;
    }
  }

  equal(rval: RValue): boolean {
    return isRInexactRational(rval)
      && rval.numerator === this.numerator
      && rval.denominator === this.denominator;
  }

  negate(): RInexactRational {
    return new RInexactRational(-1n * this.numerator, this.denominator);
  }

  isZero(): boolean {
    return this.numerator === 0n;
  }

  isNegative(): boolean {
    return this.numerator < 0;
  }

  toInexactDecimal(): RInexactDecimal {
    return new RInexactDecimal(Number(this.numerator) / Number(this.denominator));
  }
}

abstract class RCallableBase implements RValBase {
  abstract accept<T>(visitor: RCallableVisitor<T>): T;

  stringify(): string {
    throw "illegal state: cannot stringify a callable";
  }
}

class RIsStructFun extends RCallableBase {
  constructor(readonly name: string) {
    super();
  }

  accept<T>(visitor: RCallableVisitor<T>): T {
    return visitor.visitRIsStructFun(this);
  }
}

class RMakeStructFun extends RCallableBase {
  constructor(
    readonly name: string,
    readonly arity: number
  ) {
    super();
  }

  accept<T>(visitor: RCallableVisitor<T>): T {
    return visitor.visitRMakeStructFun(this);
  }
}

class RLambda extends RCallableBase {
  constructor(
    readonly closure: Environment,
    readonly params: string[],
    readonly body: ASTNode
  ) {
    super();
  }

  accept<T>(visitor: RCallableVisitor<T>): T {
    return visitor.visitRLambda(this);
  }
}

enum TypeName {
  ANY = "any",
  BOOLEAN = "boolean",
  EXACT_POSITIVE_INTEGER = "exact positive integer",
  LIST = "list",
  NON_EMPTY_LIST = "non-empty list",
  NON_NEGATIVE_REAL = "non-negative real",
  NUMBER = "number",
  REAL = "real",
  STRING = "string",
  SYMBOL = "symbol"
}

interface RPrimFunConfig {
  minArity?: number,
  maxArity?: number,
  arity?: number,
  onlyArgTypeName?: TypeName,
  allArgsTypeName?: TypeName,
  argsTypeNames?: TypeName[]
}

class RPrimFun extends RCallableBase {
  constructor(
    readonly name: string,
    readonly config: RPrimFunConfig
  ) {
    super();
  }

  typeGuardOf(typeName: TypeName): (rval: RValue) => boolean {
    switch(typeName) {
      case TypeName.ANY:
        return () => true;
      case TypeName.BOOLEAN:
        return isRBoolean;
      case TypeName.EXACT_POSITIVE_INTEGER:
        return isRExactPositiveInteger;
      case TypeName.LIST:
        return isRList;
      case TypeName.NON_EMPTY_LIST:
        return isRNonEmptyList;
      case TypeName.NON_NEGATIVE_REAL:
        return isRNonNegativeReal;
      case TypeName.NUMBER:
      case TypeName.REAL:
        return isRNumber;
      case TypeName.STRING:
        return isRString;
      case TypeName.SYMBOL:
        return isRSymbol;
      default:
        throw `illegal state: unsupported type name ${typeName}`;
    }
  }

  accept<T>(visitor: RCallableVisitor<T>): T {
    return visitor.visitRPrimFun(this);
  }

  call(_: RValue[], __: SourceSpan): RValue {
    throw "illegal state: not implemented";
  }
}

class RStructGetFun extends RCallableBase {
  constructor(
    readonly name: string,
    readonly fieldName: string,
    readonly idx: number
  ) {
    super();
  }

  accept<T>(visitor: RCallableVisitor<T>): T {
    return visitor.visitRStructGetFun(this);
  }
}

function isRBoolean(rval: RValue): rval is RBoolean {
  return rval instanceof RBoolean;
}

function isRCallable(rval: RValue): rval is RCallable {
  return rval instanceof RCallableBase;
}

function isRData(rval: RValue): rval is RDataBase {
  return rval instanceof RDataBase;
}

function isRDecimal(rval: RNumber): rval is RInexactDecimal {
  return rval instanceof RInexactDecimal;
}

function isREmptyList(rval: RValue): rval is RList {
  return isRList(rval) && rval.vals.length === 0;
}

function isRExactPositiveInteger(rval: RValue): rval is RExactReal {
  return isRExactReal(rval) && rval.denominator === 1n && rval.numerator > 0n;
}

function isRExactReal(rval: RValue): rval is RExactReal {
  return rval instanceof RExactReal;
}

function isRFalse(rval: RValue): boolean {
  return isRBoolean(rval)
    && !rval.val;
}

function isRInexact(rval: RValue): rval is RInexact {
  return isRInexactDecimal(rval)
    || isRInexactRational(rval);
}

function isRInexactDecimal(rval: RValue): rval is RInexactDecimal {
  return rval instanceof RInexactDecimal;
}

function isRInexactRational(rval: RValue): rval is RInexactRational {
  return rval instanceof RInexactRational;
}

function isRInteger(rval: RValue): rval is RInexact {
  return isRRational(rval) && rval.denominator === 1n;
}

function isRList(rval: RValue): rval is RList {
  return rval instanceof RList;
}

function isRNonEmptyList(rval: RValue): rval is RList {
  return isRList(rval) && rval.vals.length > 0;
}

function isRNonNegativeReal(rval: RValue): rval is RNumberBase {
  return isRNumber(rval) && rval.toInexactDecimal().val >= 0;
}

function isRNumber(rval: RValue): rval is RNumberBase {
  return rval instanceof RNumberBase;
}

function isRPrimFun(rval: RCallable): rval is RPrimFun {
  return rval instanceof RPrimFun;
}

function isRRational(rval: RValue): rval is RRational {
  return rval instanceof RExactReal
    || rval instanceof RInexactRational;
}

function isRString(rval: RValue): rval is RString {
  return rval instanceof RString;
}

function isRStruct(rval: RValue): rval is RStruct {
  return rval instanceof RStruct;
}

function isRStructType(rval: RValue): rval is RStructType {
  return rval instanceof RStructType;
}

function isRSymbol(rval: RValue): rval is RSymbol {
  return rval instanceof RSymbol;
}

function isRTrue(rval: RValue): boolean {
  return isRBoolean(rval)
    && rval.val;
}

function isRVoid(rval: RValue): rval is RVoid {
  return rval instanceof RVoid;
}

function toRBoolean(val: boolean): RBoolean {
  return val ? R_TRUE : R_FALSE;
}

abstract class RMath {
  static add(rnum1: RNumber, rnum2: RNumber): RNumber {
    const isExact = rnum1 instanceof RExactReal && rnum2 instanceof RExactReal;
    if (isRDecimal(rnum1) || isRDecimal(rnum2)) {
      return new RInexactDecimal(rnum1.toInexactDecimal().val + rnum2.toInexactDecimal().val);
    } else {
      const numerator = rnum1.numerator * rnum2.denominator + rnum1.denominator * rnum2.numerator;
      const denominator = rnum1.denominator * rnum2.denominator;
      if (isExact) {
        return new RExactReal(numerator, denominator);
      } else {
        return new RInexactRational(numerator, denominator);
      }
    }
  }

  static div(rnum1: RNumber, rnum2: RNumber): RNumber {
    const isExact = rnum1 instanceof RExactReal && rnum2 instanceof RExactReal;
    if (isRDecimal(rnum1) || isRDecimal(rnum2)) {
      return new RInexactDecimal(rnum1.toInexactDecimal().val / rnum2.toInexactDecimal().val);
    } else {
      const numerator = rnum1.numerator * rnum2.denominator;
      const denominator = rnum1.denominator * rnum2.numerator;
      if (isExact) {
        return new RExactReal(numerator, denominator);
      } else {
        return new RInexactRational(numerator, denominator);
      }
    }
  }

  static mul(rnum1: RNumber, rnum2: RNumber): RNumber {
    const isExact = rnum1 instanceof RExactReal && rnum2 instanceof RExactReal;
    if (isRDecimal(rnum1) || isRDecimal(rnum2)) {
      return new RInexactDecimal(rnum1.toInexactDecimal().val * rnum2.toInexactDecimal().val);
    } else {
      const numerator = rnum1.numerator * rnum2.numerator;
      const denominator = rnum1.denominator * rnum2.denominator;
      if (isExact) {
        return new RExactReal(numerator, denominator);
      } else {
        return new RInexactRational(numerator, denominator);
      }
    }
  }

  static pow(base: RNumber, expt: RNumber): RNumber {
    if (isRDecimal(base) || isRDecimal(expt)) {
      if (base.isNegative()) {
        throw "illegal state: complex numbers not supported";
      }
      return new RInexactDecimal(Math.pow(base.toInexactDecimal().val, base.toInexactDecimal().val));
    } else if (expt.isZero()) {
      return new RExactReal(1n);
    } else if (base.isZero()) {
      return new RExactReal(0n);
    } else if (base.isNegative() && expt.denominator !== 1n) {
      throw "illegal state: complex numbers not supported";
    } else {
      let pow;
      let numerator;
      let denominator;
      if (expt.isNegative()) {
        pow = expt.negate();
        numerator = base.denominator ** pow.numerator;
        denominator = base.numerator ** pow.numerator;
      } else {
        pow = expt;
        numerator = base.numerator ** pow.numerator;
        denominator = base.denominator ** pow.numerator;
      }
      if (RMath.perfectPower(numerator, expt.denominator) && RMath.perfectPower(denominator, expt.denominator)) {
        if (isRExactReal(base) && isRExactReal(expt)) {
          return new RExactReal(RMath.iroot(numerator, expt.denominator), RMath.iroot(denominator, expt.denominator));
        } else {
          return new RInexactRational(RMath.iroot(numerator, expt.denominator), RMath.iroot(denominator, expt.denominator));
        }
      } else {
        return new RInexactDecimal((Number(numerator) ** (1 / Number(pow.denominator))) / (Number(denominator) ** (1 / Number(pow.denominator))));
      }
    }
  }

  static sub(rnum1: RNumber, rnum2: RNumber): RNumber {
    const isExact = rnum1 instanceof RExactReal && rnum2 instanceof RExactReal;
    if (isRDecimal(rnum1) || isRDecimal(rnum2)) {
      return new RInexactDecimal(rnum1.toInexactDecimal().val - rnum2.toInexactDecimal().val);
    } else {
      const numerator = rnum1.numerator * rnum2.denominator - rnum1.denominator * rnum2.numerator;
      const denominator = rnum1.denominator * rnum2.denominator;
      if (isExact) {
        return new RExactReal(numerator, denominator);
      } else {
        return new RInexactRational(numerator, denominator);
      }
    }
  }

  private static perfectPower(base: bigint, root: bigint): boolean {
    return (RMath.iroot(base, root) ** root) === base;}

  // https://stackoverflow.com/a/64190462
  private static iroot(base: bigint, root: bigint): bigint {
    let s = base + 1n;
    const k1 = root - 1n;
    let u = base;
    while (u < s) {
      s = u;
      u = ((u*k1) + base / (u ** k1)) / root;
    }
    return s;
  }
}

const R_VOID = new RVoid();
const R_TRUE = new RBoolean(true);
const R_FALSE = new RBoolean(false);
const R_EMPTY_LIST = new RList([]);

interface RCallableVisitor<T> {
  visitRIsStructFun(rval: RIsStructFun): T;
  visitRMakeStructFun(rval: RMakeStructFun): T;
  visitRLambda(rval: RLambda): T;
  visitRPrimFun(rval: RPrimFun): T;
  visitRStructGetFun(rval: RStructGetFun): T;
}
