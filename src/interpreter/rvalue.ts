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
  R_NONE,
  R_TRUE,
  RData,
  RExactReal,
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
  RValue,
  isRBoolean,
  isRCallable,
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
  | RData
  | RCallable
  | RNone;
type RCallable =
  | RMakeStructFun
  | RLambda
  | RPrimFun;

type RNumber =
  | RExactReal;

interface RValBase {
  stringify(): string;
}

class RNone implements RValBase {
  stringify(): string {
    throw "illegal state: trying to stringify RNone";
  }
}

interface RData extends RValBase {}

interface RAtomic extends RData {}

class RBoolean implements RAtomic {
  constructor(readonly val: boolean) {}

  stringify(): string {
    return this.val ? "#true" : "#false";
  }
}

class RExactReal implements RAtomic {
  constructor(
    readonly numerator: bigint,
    readonly denominator: bigint
  ) {
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
    return (Number(this.numerator) / Number(this.denominator)).toString();
  }
}

class RString implements RAtomic {
  constructor(readonly val: string) {}

  stringify(): string {
    return `"${this.val}"`;
  }
}

class RSymbol implements RAtomic {
  constructor(readonly val: string) {}

  stringify(): string {
    return "'" + this.val;
  }
}

class RList implements RData {
  constructor(readonly vals: RValue[]) {}

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
}

class RStruct implements RData {
  constructor(
    readonly name: string,
    readonly vals: RValue[]
  ) {}

  stringify(): string {
    if (this.vals.length === 0) {
      return `(make-${this.name})`;
    } else {
      return `(make-${this.name} ${this.vals.map(val => val.stringify()).join(" ")})`;
    }
  }
}

class RStructType implements RData {
  constructor(readonly name: string) {}

  stringify(): string {
    throw `illegal state: cannot stringify a structure type`;
  }
}

abstract class RCallableBase implements RValBase {
  abstract accept<T>(visitor: RCallableVisitor<T>): T;

  stringify(): string {
    console.trace()
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
        return isRNumber;
      case "symbol":
        return isRSymbol;
      default:
        throw "illegal state: unsupported allArgsTypeName";
    }
  };

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

function isRList(rval: RValue): rval is RList {
  return rval instanceof RList;
}

function isRNumber(rval: RValue): rval is RNumber {
  return rval instanceof RExactReal;
}

function isRPrimFun(rval: RCallable): rval is RPrimFun {
  return rval instanceof RPrimFun;
}

function isRSymbol(rval: RValue): rval is RSymbol {
  return rval instanceof RSymbol;
}

function isRTrue(rval: RBoolean): boolean {
  return rval === R_TRUE;
}

abstract class RMath {
  static add(rnum1: RNumber, rnum2: RNumber): RNumber {
    return new RExactReal(
      rnum1.numerator * rnum2.denominator + rnum1.denominator * rnum2.numerator,
      rnum1.denominator * rnum2.denominator
    );
  }

  static div(rnum1: RNumber, rnum2: RNumber): RNumber {
    return new RExactReal(
      rnum1.numerator * rnum2.denominator,
      rnum1.denominator * rnum2.numerator
    );
  }

  static mul(rnum1: RNumber, rnum2: RNumber): RNumber {
    return new RExactReal(
      rnum1.numerator * rnum2.numerator,
      rnum1.denominator * rnum2.denominator
    );
  }

  static sub(rnum1: RNumber, rnum2: RNumber): RNumber {
    return new RExactReal(
      rnum1.numerator * rnum2.denominator - rnum1.denominator * rnum2.numerator,
      rnum1.denominator * rnum2.denominator
    );
  }

  static invert(rnum: RNumber) {
    return new RExactReal(
      rnum.denominator,
      rnum.numerator
    );
  }

  static negate(rnum: RNumber) {
    return new RExactReal(
      -1n * rnum.numerator,
      rnum.denominator
    );
  }
}

const R_NONE = new RNone();
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
