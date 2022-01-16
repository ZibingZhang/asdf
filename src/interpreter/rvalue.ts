/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AnyType,
  BooleanType,
  CharacterType,
  ExactNonNegativeIntegerType,
  ExactPositiveIntegerType,
  FunctionType,
  IntegerType,
  ListType,
  NonNegativeRealType,
  NumberType,
  RealType,
  StringType,
  StructType,
  StructTypeType,
  SymbolType,
  Type,
  VoidType
} from "./types";
import {
  NO_SOURCE_SPAN,
  SourceSpan
} from "./sourcespan";
import {
  ASTNode
} from "./ast";
import {
  Environment
} from "./environment";
import {
  SETTINGS
} from "./settings";

export {
  R_EMPTY_LIST,
  R_FALSE,
  R_TRUE,
  R_VOID,
  RBoolean,
  RCallable,
  RCharacter,
  RData,
  RExactReal,
  RInexactReal,
  RIsStructFun,
  RLambda,
  RList,
  RMakeStructFun,
  RMath,
  RNumber,
  RPrimFun,
  RCallableConfig,
  RPrimTestFunConfig,
  RString,
  RStruct,
  RStructGetFun,
  RStructType,
  RSymbol,
  RTestResult,
  RValue,
  isRBoolean,
  isRCallable,
  isRData,
  isREmptyList,
  isRExactPositiveInteger,
  isRExactReal,
  isRFalse,
  isRInexactReal,
  isRInteger,
  isRList,
  isRNumber,
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
type RData =
  | RAtomic
  | RList
  | RStruct;
type RAtomic =
  | RBoolean
  | RCharacter
  | RNumber
  | RString
  | RStructType
  | RSymbol
  | RVoid;
type RNumber =
  | RExactReal
  | RInexactReal;

interface RValBase {
  stringify(): string;

  getType(args: number): Type;
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

  getType(): Type {
    throw "illegal state: should not be asking type of test result";
  }
}

abstract class RDataBase implements RValBase {
  abstract stringify(): string;

  abstract getType(): Type;

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

  getType(): Type {
    return new BooleanType();
  }

  equalWithin(rval: RValue, _: number): boolean {
    return isRBoolean(rval)
      && rval.val === this.val;
  }
}

class RCharacter extends RDataBase {
  constructor(readonly val: string) {
    super();
  }

  stringify(): string {
    return `#\\${this.val}`;
  }

  getType(): Type {
    return new CharacterType();
  }

  equalWithin(rval: RValue, _: number): boolean {
    return isRCharacter(rval)
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
    } else if (SETTINGS.stringify.abbreviatedList) {
      return `(list ${this.vals.map(val => val.stringify()).join(" ")})`;
    } else {
      let output = `(cons ${this.vals[0].stringify()}`;
      for (const val of this.vals.slice(1)) {
        output += ` (cons ${val.stringify()}`;
      }
      output += " '()" + ")".repeat(this.vals.length);
      return output;
    }
  }

  getType(): Type {
    return new ListType(this.vals.length);
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
  ESCAPED_A = String.fromCharCode(7);
  ESCAPED_B = String.fromCharCode(8);
  ESCAPED_T = String.fromCharCode(9);
  ESCAPED_N = String.fromCharCode(10);
  ESCAPED_V = String.fromCharCode(11);
  ESCAPED_F = String.fromCharCode(12);
  ESCAPED_R = String.fromCharCode(13);
  ESCAPED_E = String.fromCharCode(27);

  constructor(readonly val: string) {
    super();
  }

  stringify(): string {
    let str = "";
    for (const ch of this.val) {
      switch (ch) {
        case this.ESCAPED_A: {
          str += "\\a";
          break;
        }
        case this.ESCAPED_B: {
          str += "\\b";
          break;
        }
        case this.ESCAPED_T: {
          str += "\\t";
          break;
        }
        case this.ESCAPED_N: {
          str += "\\n";
          break;
        }
        case this.ESCAPED_V: {
          str += "\\v";
          break;
        }
        case this.ESCAPED_F: {
          str += "\\f";
          break;
        }
        case this.ESCAPED_R: {
          str += "\\r";
          break;
        }
        case this.ESCAPED_E: {
          str += "\\e";
          break;
        }
        case "\"": {
          str += "\\\"";
          break;
        }
        case "\\": {
          str += "\\\\";
          break;
        }
        default: {
          str += ch;
        }
      }
    }
    return `"${str}"`;
  }

  getType(): Type {
    return new StringType();
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

  getType(): Type {
    return new StructType(this.name);
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

  getType(): Type {
    return new StructTypeType(this.name);
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

  getType(): Type {
    return new SymbolType();
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

  getType(): Type {
    return new VoidType();
  }

  equalWithin(rval: RValue, _: number): boolean {
    return isRVoid(rval);
  }
}

abstract class RNumberBase extends RDataBase {
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
      if (this.isNegative()) {
        const flooredValue = this.numerator / this.denominator;
        return `${flooredValue}${(Number(this.numerator - flooredValue * this.denominator) / Number(this.denominator)).toString().slice(2)}`;
      } else {
        const flooredValue = this.numerator / this.denominator;
        return `${flooredValue}${(Number(this.numerator - flooredValue * this.denominator) / Number(this.denominator)).toString().slice(1)}`;
      }
    }
  }

  equalWithin(rval: RValue, ep: number): boolean {
    return isRNumber(rval)
      && this.within(rval, ep);
  }

  within(that: RNumber, ep: number): boolean {
    return Math.abs(this.toDecimal() - that.toDecimal()) <= ep;
  }

  isPositive(): boolean {
    return this.numerator > 0;
  }

  isZero(): boolean {
    return this.numerator === 0n;
  }

  isNegative(): boolean {
    return this.numerator < 0;
  }

  toDecimal(): number {
    const flooredVal = this.numerator / this.denominator;
    return Number(flooredVal)
      + Number(this.numerator - flooredVal * this.denominator)
      / Number(this.denominator);
  }

  abstract negate(): RNumber;
}

class RExactReal extends RNumberBase {
  getType(): Type {
    if (this.denominator === 1n) {
      if (this.numerator > 0) {
        return new ExactPositiveIntegerType();
      } else if (this.numerator === 0n) {
        return new ExactNonNegativeIntegerType();
      } else {
        return new IntegerType();
      }
    } else if (this.numerator >= 0) {
      return new NonNegativeRealType();
    } else {
      return new RealType();
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
}

class RInexactReal extends RNumberBase {
  stringify(): string {
    return `#i${super.stringify()}`;
  }

  getType(): Type {
    if (this.denominator === 0n) {
      return new IntegerType();
    } else {
      return new NumberType();
    }
  }

  equal(rval: RValue): boolean {
    return isRNumber(rval)
      && rval.numerator === this.numerator
      && rval.denominator === this.denominator;
  }

  negate(): RInexactReal {
    return new RInexactReal(-1n * this.numerator, this.denominator);
  }
}

interface RCallableConfig {
  minArity?: number,
  relaxedMinArity?: number
}

interface RPrimTestFunConfig {
  minArity?: number,
  arity?: number,
  maxArity?: number
}

abstract class RCallable implements RValBase {
  constructor(readonly config: RCallableConfig = {}) {}

  abstract stringify(): string;

  abstract getType(args: number): FunctionType;

  abstract accept<T>(visitor: RCallableVisitor<T>): T;
}

class RIsStructFun extends RCallable {
  constructor(readonly name: string) {
    super();
  }

  accept<T>(visitor: RCallableVisitor<T>): T {
    return visitor.visitRIsStructFun(this);
  }

  stringify(): string {
    return this.name;
  }

  getType(): FunctionType {
    return new FunctionType([new AnyType()], new BooleanType());
  }
}

class RMakeStructFun extends RCallable {
  constructor(
    readonly name: string,
    readonly arity: number
  ) {
    super();
  }

  accept<T>(visitor: RCallableVisitor<T>): T {
    return visitor.visitRMakeStructFun(this);
  }

  stringify(): string {
    return this.name;
  }

  getType(): FunctionType {
    return new FunctionType(new Array(this.arity).fill(new AnyType()), new StructType(this.name));
  }
}

class RLambda extends RCallable {
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

  stringify(): string {
    throw "illegal state: free-form lambdas not supported";
  }

  getType(): FunctionType {
    return new FunctionType(new Array(this.params.length).fill(new AnyType()), new AnyType());
  }
}

abstract class RPrimFun extends RCallable {
  constructor(
    readonly name: string,
    readonly config: RCallableConfig = {}
  ) {
    super();
  }

  accept<T>(visitor: RCallableVisitor<T>): T {
    return visitor.visitRPrimFun(this);
  }

  stringify(): string {
    return this.name;
  }

  call(_: RValue[], __: SourceSpan, ___: Environment): RValue {
    throw "illegal state: not implemented";
  }
}

class RStructGetFun extends RCallable {
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

  stringify(): string {
    return `${this.name}-${this.fieldName}`;
  }

  getType(): FunctionType {
    return new FunctionType([new StructType(this.name)], new AnyType());
  }
}

function isRBoolean(rval: RValue): rval is RBoolean {
  return rval instanceof RBoolean;
}

function isRCallable(rval: RValue): rval is RCallable {
  return rval instanceof RCallable;
}

function isRCharacter(rval: RValue): rval is RCharacter {
  return rval instanceof RCharacter;
}

function isRData(rval: RValue): rval is RData {
  return rval instanceof RDataBase;
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

function isRInexactReal(rval: RValue): rval is RInexactReal {
  return rval instanceof RInexactReal;
}

function isRInteger(rval: RValue): rval is RNumber {
  return isRNumber(rval) && rval.denominator === 1n;
}

function isRList(rval: RValue): rval is RList {
  return rval instanceof RList;
}

function isRNumber(rval: RValue): rval is RNumber {
  return rval instanceof RNumberBase;
}

function isRPrimFun(rval: RCallable): rval is RPrimFun {
  return rval instanceof RPrimFun;
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
  static fromDecimal(num: number) {
    const scalar = 10 ** num.toString().length;
    return new RInexactReal(
      BigInt(num * scalar),
      BigInt(scalar)
    );
  }

  static toExact(rnum: RNumber): RExactReal {
    return new RExactReal(rnum.numerator, rnum.denominator);
  }

  static toInexact(rnum: RNumber): RInexactReal {
    return new RInexactReal(rnum.numerator, rnum.denominator);
  }

  static make(isExact: boolean, numerator: bigint, denominator = 1n): RNumber {
    if (isExact) {
      return new RExactReal(numerator, denominator);
    } else {
      return new RInexactReal(numerator, denominator);
    }
  }

  static ceil(rnum: RNumber): RNumber {
    if (rnum.denominator === 1n) {
      return rnum;
    } else {
      if (rnum.isNegative()) {
        return RMath.make(
          isRExactReal(rnum),
          rnum.numerator / rnum.denominator
        );
      } else {
        return RMath.make(
          isRExactReal(rnum),
          rnum.numerator / rnum.denominator + 1n
        );
      }
    }
  }

  static floor(rnum: RNumber): RNumber {
    if (rnum.denominator === 1n) {
      return rnum;
    } else {
      if (rnum.isNegative()) {
        return RMath.make(
          isRExactReal(rnum),
          rnum.numerator / rnum.denominator - 1n
        );
      } else {
        return RMath.make(
          isRExactReal(rnum),
          rnum.numerator / rnum.denominator
        );
      }
    }
  }

  static add(rnum1: RNumber, rnum2: RNumber): RNumber {
    const isExact = isRExactReal(rnum1) && isRExactReal(rnum2);
    const numerator =
      rnum1.numerator * rnum2.denominator
      + rnum1.denominator * rnum2.numerator;
    const denominator = rnum1.denominator * rnum2.denominator;
    return RMath.make(isExact, numerator, denominator);
  }

  static div(rnum1: RNumber, rnum2: RNumber): RNumber {
    const isExact = isRExactReal(rnum1) && isRExactReal(rnum2);
    const numerator = rnum1.numerator * rnum2.denominator;
    const denominator = rnum1.denominator * rnum2.numerator;
    return RMath.make(isExact, numerator, denominator);
  }

  static mul(rnum1: RNumber, rnum2: RNumber): RNumber {
    const isExact = isRExactReal(rnum1) && isRExactReal(rnum2);
    const numerator = rnum1.numerator * rnum2.numerator;
    const denominator = rnum1.denominator * rnum2.denominator;
    return RMath.make(isExact, numerator, denominator);
  }

  static sub(rnum1: RNumber, rnum2: RNumber): RNumber {
    const isExact = isRExactReal(rnum1) && isRExactReal(rnum2);
    const numerator =
      rnum1.numerator * rnum2.denominator
      - rnum1.denominator * rnum2.numerator;
    const denominator = rnum1.denominator * rnum2.denominator;
    return RMath.make(isExact, numerator, denominator);
  }

  static pow(base: RNumber, expt: RNumber): RNumber {
    if (expt.isZero()) {
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
      if (
        RMath.perfectPower(numerator, expt.denominator)
        && RMath.perfectPower(denominator, expt.denominator)
      ) {
        const isExact = isRExactReal(base) && isRExactReal(expt);
        return RMath.make(
          isExact,
          RMath.iroot(numerator, expt.denominator),
          RMath.iroot(denominator, expt.denominator)
        );
      } else {
        return RMath.fromDecimal(
          (Number(numerator) ** (1 / Number(pow.denominator)))
          / (Number(denominator) ** (1 / Number(pow.denominator)))
        );
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
