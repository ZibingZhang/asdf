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
  RLambda,
  RList,
  RMakeStructFun,
  RMath,
  RNumber,
  RPrimFun,
  RPrimFunConfig,
  RString,
  RStruct,
  RSymbol,
  RValue,
  isRBoolean,
  isRCallable,
  isRData,
  isRPrimFun,
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

class RNumber implements RAtomic {
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
    return this.val;
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
    let output = "";
    for (const val of this.vals) {
      output += `(cons ${val.stringify()}`;
    }
    output += "'()" + ")".repeat(this.vals.length);
    return output;
  }
}

class RStruct implements RData {
  constructor(readonly name: string, readonly vals: RValue[]) {}

  stringify(): string {
    if (this.vals.length === 0) {
      return `(make-${this.name})`;
    } else {
      return `(make-${this.name} ${this.vals.map(val => val.stringify()).join(" ")})`;
    }
  }
}

abstract class RCallableBase implements RValBase {
  abstract accept<T>(visitor: RCallableVisitor<T>): T;

  stringify(): string {
    throw "illegal state: cannot stringify a callable";
  }
}

interface RPrimFunConfig {
  minArity?: number,
  arity?: number,
  onlyArgTypeName?: string,
  allArgsTypeName?: string
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

class RPrimFun extends RCallableBase {
  typeGuardOf = (typeName: string) => {
    switch(typeName) {
      case "number":
        return isRNumber;
      default:
        throw "illegal state: unsupported allArgsTypeName";
    }
  };

  constructor(
    readonly name: string,
    readonly config: RPrimFunConfig
  ) {
    super();
  }

  accept<T>(visitor: RCallableVisitor<T>): T {
    return visitor.visitRPrimFun(this);
  }

  call(_: Environment, __: RValue[], ___: SourceSpan): RValue {
    throw "illegal state: not implemented";
  }
}

function isRBoolean(rval: RValue): rval is RBoolean {
  return rval instanceof RBoolean;
}

function isRCallable(rval: RValue): rval is RCallable {
  return rval instanceof RCallableBase;
}

function isRData(rval: RValue): rval is RData {
  return !Object.prototype.hasOwnProperty.call(rval, "eval");
}

function isRNumber(rval: RValue): rval is RNumber {
  return rval instanceof RNumber;
}

function isRPrimFun(rval: RCallable): rval is RPrimFun {
  return rval instanceof RPrimFun;
}

function isRTrue(rval: RBoolean): boolean {
  return rval === R_TRUE;
}

abstract class RMath {
  static add(rnum1: RNumber, rnum2: RNumber): RNumber {
    return new RNumber(
      rnum1.numerator * rnum2.denominator + rnum1.denominator * rnum2.numerator,
      rnum1.denominator * rnum2.denominator
    );
  }

  static div(rnum1: RNumber, rnum2: RNumber): RNumber {
    return new RNumber(
      rnum1.numerator * rnum2.denominator,
      rnum1.denominator * rnum2.numerator
    );
  }

  static mul(rnum1: RNumber, rnum2: RNumber): RNumber {
    return new RNumber(
      rnum1.numerator * rnum2.numerator,
      rnum1.denominator * rnum2.denominator
    );
  }

  static sub(rnum1: RNumber, rnum2: RNumber): RNumber {
    return new RNumber(
      rnum1.numerator * rnum2.denominator - rnum1.denominator * rnum2.numerator,
      rnum1.denominator * rnum2.denominator
    );
  }

  static invert(rnum: RNumber) {
    return new RNumber(
      rnum.denominator,
      rnum.numerator
    );
  }

  static negate(rnum: RNumber) {
    return new RNumber(
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
  visitRMakeStructFun(rcallable: RMakeStructFun): T;
  visitRLambda(rcallable: RLambda): T;
  visitRPrimFun(rcallable: RPrimFun): T;
}
