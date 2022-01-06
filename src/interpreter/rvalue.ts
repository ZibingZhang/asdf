/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  ASTNode
} from "./ast.js";
import {
  Environment
} from "./environment.js";
import {
  FA_ARITY_ERR,
  FA_MIN_ARITY_ERR,
  FA_NTH_WRONG_TYPE_ERR,
  FA_WRONG_TYPE_ERR
} from "./error.js";
import {
  StageError
} from "./pipeline.js";
import {
  SourceSpan
} from "./sourcespan.js";

export {
  R_EMPTY_LIST,
  R_FALSE,
  R_TRUE,
  RData,
  RLambda,
  RList,
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
  isRTrue
};

// https://stackoverflow.com/questions/17445231/js-how-to-find-the-greatest-common-divisor
function gcd(a: bigint, b: bigint): bigint {
  if (!b) {
    return a;
  }
  return gcd(b, a % b);
}

type RValue = RData | RCallable;
type RCallable = RLambda | RPrimFun;

interface RValBase {
  stringify(): string;
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
    return `(make-${this.name} ${this.vals.map(val => val.stringify()).join(" ")})`;
  }
}

interface RCallableBase extends RValBase {}

interface RPrimFunConfig {
  minArity?: number,
  arity?: number,
  onlyArgTypeName?: string,
  allArgsTypeName?: string
}

class RLambda implements RCallableBase {
  constructor(
    readonly closure: Environment,
    readonly params: string[],
    readonly body: ASTNode
  ) {}

  eval(paramEnv: Environment, env: Environment): RValue {
    const closureCopy = this.closure.copy();
    closureCopy.parentEnv = env;
    paramEnv.parentEnv = closureCopy;
    return this.body.eval(paramEnv);
  }

  stringify(): string {
    throw "illegal state: cannot stringify a callable";
  }
}

class RPrimFun implements RCallableBase {
  private typeGuardOf = (typeName: string) => {
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
  ) {}

  eval(env: Environment, args: RValue[], sourceSpan: SourceSpan): RValue {
    if (this.config.minArity && args.length < this.config.minArity) {
      throw new StageError(
        FA_MIN_ARITY_ERR(this.name, this.config.minArity, args.length),
        sourceSpan
      );
    }
    if (this.config.arity && args.length !== this.config.arity) {
      throw new StageError(
        FA_ARITY_ERR(this.name, this.config.arity, args.length),
        sourceSpan
      );
    }
    if (this.config.onlyArgTypeName) {
      const typeGuard = this.typeGuardOf(this.config.onlyArgTypeName);
      if (!typeGuard(args[0])) {
        throw new StageError(
          FA_WRONG_TYPE_ERR(this.name, this.config.onlyArgTypeName, args[0].stringify()),
          sourceSpan
        );
      }
    }
    if (this.config.allArgsTypeName) {
      const typeGuard = this.typeGuardOf(this.config.allArgsTypeName);
      for (const [idx, rval] of args.entries()) {
        if (!typeGuard(rval)) {
          throw new StageError(
            FA_NTH_WRONG_TYPE_ERR(this.name, idx, this.config.allArgsTypeName, rval.stringify()),
            sourceSpan
          );
        }
      }
    }
    return this.call(env, args, sourceSpan);
  }

  stringify(): string {
    throw "illegal state: cannot stringify a callable";
  }

  call(_: Environment, __: RValue[], ___: SourceSpan): RValue {
    throw "illegal state: not implemented";
  }
}

function isRBoolean(rval: RValue): rval is RBoolean {
  return rval instanceof RBoolean;
}

function isRCallable(rval: RValue): rval is RCallable {
  return "eval" in rval;
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

const R_TRUE = new RBoolean(true);
const R_FALSE = new RBoolean(false);
const R_EMPTY_LIST = new RList([]);
