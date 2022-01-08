/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ASTNode
} from "./ast.js";
import {
  Environment
} from "./environment.js";
import {
  SourceSpan
} from "./sourcespan.js";

export {
  R_EMPTY_LIST,
  R_FALSE,
  R_TRUE,
  R_VOID,
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
  RPrimTestFun,
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
  isRInexact,
  isRList,
  isRPrimFun,
  isRSymbol,
  isRTrue,
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
  | RPrimTestFun
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

interface RValBase {
  stringify(): string;
}

class RTestResult implements RValBase {
  constructor(
    readonly passed: boolean,
    readonly msg: string = ""
  ) {}

  stringify(): string {
    throw "illegal state: cannot stringify a test result";
  }
}

abstract class RDataBase implements RValBase {
  abstract stringify(): string;

  abstract equals(rval: RValue): boolean;

  eqv(rval: RValue): boolean {
    return this.equals(rval);
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

  equals(rval: RValue): boolean {
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

  equals(rval: RValue): boolean {
    return isRList(rval)
      && rval.vals.length === this.vals.length
      && rval.vals.every((rval, idx) => {
        const val = this.vals[idx];
        return isRData(rval)
          && isRData(val)
          && rval.equals(val);
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

  equals(rval: RValue): boolean {
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

  equals(rval: RValue): boolean {
    return isRStruct(rval)
      && rval.name === this.name
      && rval.vals.every((rval, idx) => {
        const val = this.vals[idx];
        return isRData(rval)
          && isRData(val)
          && rval.equals(val);
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

  equals(rval: RValue): boolean {
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

  equals(rval: RValue): boolean {
    return isRSymbol(rval)
      && rval.val === this.val;
  }
}

class RVoid extends RDataBase {
  stringify(): string {
    return "(void)";
  }

  equals(rval: RValue): boolean {
    return isRVoid(rval);
  }
}

abstract class RNumberBase extends RDataBase {
  abstract negate(): RNumber;

  abstract isZero(): boolean;

  abstract toInexactDecimal(): RInexactDecimal;

  abstract stringify(): string;
}

class RExactReal extends RNumberBase {
  constructor(
    readonly numerator: bigint,
    readonly denominator: bigint
  ) {
    super();
    const divisor = gcd(
      numerator >= 0
        ? numerator
        : -1n * numerator,
      denominator
    );
    this.numerator = numerator / divisor;
    this.denominator = denominator / divisor;
  }

  stringify(): string {
    if (this.denominator === 1n) {
      return this.numerator.toString();
    } else {
      const flooredValue = this.numerator / this.denominator;
      return `${flooredValue}${(Number(this.numerator - flooredValue * this.denominator) / Number(this.denominator)).toString().slice(1)}`;
    }
  }

  equals(rval: RValue): boolean {
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

  equals(rval: RValue): boolean {
    return isRInexactDecimal(rval)
      && rval.val === this.val;
  }

  negate(): RInexactDecimal {
    return new RInexactDecimal(-1 * this.val);
  }

  isZero(): boolean {
    return this.val === 0;
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
    const divisor = gcd(
      numerator >= 0
        ? numerator
        : -1n * numerator,
      denominator
    );
    this.numerator = numerator / divisor;
    this.denominator = denominator / divisor;
  }

  stringify(): string {
    if (this.denominator === 1n) {
      return `#i${this.numerator.toString()}`;
    } else {
      const flooredValue = this.numerator / this.denominator;
      return `#i${flooredValue}${(Number(this.numerator - flooredValue * this.denominator) / Number(this.denominator)).toString().slice(1)}`;
    }
  }

  equals(rval: RValue): boolean {
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

interface RPrimFunConfig {
  minArity?: number,
  arity?: number,
  onlyArgTypeName?: string,
  allArgsTypeName?: string,
  argsTypeNames?: string[]
}

class RPrimFun extends RCallableBase {
  constructor(
    readonly name: string,
    readonly config: RPrimFunConfig
  ) {
    super();
  }

  typeGuardOf(typeName: string): (rval: RValue) => boolean {
    switch(typeName) {
      case "any":
        return () => true;
      case "boolean":
        return isRBoolean;
      case "list":
        return isRList;
      case "number":
      case "real":
        return isRNumber;
      case "symbol":
        return isRSymbol;
      default:
        throw "illegal state: unsupported allArgsTypeName";
    }
  }

  accept<T>(visitor: RCallableVisitor<T>): T {
    return visitor.visitRPrimFun(this);
  }

  call(_: RValue[], __: SourceSpan): RValue {
    throw "illegal state: not implemented";
  }
}

class RPrimTestFun extends RPrimFun {
  constructor(
    readonly name: string,
    readonly config: RPrimFunConfig
  ) {
    super(name, config);
  }

  accept<T>(visitor: RCallableVisitor<T>): T {
    return visitor.visitRPrimTestFun(this);
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

function isRExactReal(rval: RValue): rval is RExactReal {
  return rval instanceof RExactReal;
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

function isRList(rval: RValue): rval is RList {
  return rval instanceof RList;
}

function isRNumber(rval: RValue): rval is RNumberBase {
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

function isRTrue(rval: RBoolean): boolean {
  return isRBoolean(rval)
    && rval.val;
}

function isRVoid(rval: RValue): rval is RVoid {
  return rval instanceof RVoid;
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
  visitRPrimTestFun(rval: RPrimTestFun): T;
  visitRStructGetFun(rval: RStructGetFun): T;
}
