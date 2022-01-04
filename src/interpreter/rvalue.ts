import {
  Environment
} from "./environment.js";
import {
  FA_MIN_ARITY_ERR, FA_NTH_WRONG_TYPE_ERR
} from "./error.js";
import {
  StageError
} from "./pipeline.js";
import {
  NO_SOURCE_SPAN
} from "./sourcespan.js";

export {
  R_EMPTY_LIST,
  RBool,
  RList,
  RMath,
  RNum,
  RPrimFun,
  RString,
  RSymbol,
  RVal,
  isRCallable,
  isRData,
  isRNum
};

// https://stackoverflow.com/questions/17445231/js-how-to-find-the-greatest-common-divisor
function gcd(a: bigint, b: bigint): bigint {
  if (!b) {
    return a;
  }
  return gcd(b, a % b);
}

type RVal = RData | RCallable;

interface RValBase {
  stringify(): string;
}

interface RData extends RValBase {}

interface RAtomic extends RData {}

class RBool implements RAtomic {
  constructor(readonly val: boolean) {}

  stringify(): string {
    return this.val ? "#true" : "#false";
  }
}

class RNum implements RAtomic {
  constructor(
    readonly numerator: bigint,
    readonly denominator: bigint
  ) {
    const divisor = gcd(numerator >= 0 ? numerator : -1n * numerator, denominator);
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
  constructor(readonly vals: RVal[]) {}

  stringify(): string {
    if (this.vals.length === 0) {
      return "'()";
    } else {
      let output = "";
      for (const val of this.vals) {
        output += `(cons ${val.stringify()}`;
      }
      output += "'()" + ")".repeat(this.vals.length);
    }
    return this.vals.length === 0
      ? "'()"
      : `(list ${this.vals.map(val => val.stringify()).join(" ")})`;
  }
}

interface RCallable extends RValBase {
  eval(env: Environment, args: RVal[]): RVal;
}

interface RPrimFunConfig {
  minArity?: number,
  allArgsTypeName?: string
}

abstract class RPrimFun implements RCallable {
  constructor(
    readonly name: string,
    readonly config: RPrimFunConfig
  ) {}

  eval(env: Environment, args: RVal[]): RVal {
    if (this.config.minArity && args.length < this.config.minArity) {
      throw new StageError(FA_MIN_ARITY_ERR(this.name, this.config.minArity, args.length), NO_SOURCE_SPAN);
    }
    if (this.config.allArgsTypeName) {
      let typeGuard;
      switch (this.config.allArgsTypeName) {
        case "number":
          typeGuard = isRNum;
          break;
        default:
          throw "illegal state: unsupported allArgsTypeName";
      }
      for (const [idx, rval] of args.entries()) {
        if (!typeGuard(rval)) {
          throw new StageError(FA_NTH_WRONG_TYPE_ERR(this.name, idx, this.config.allArgsTypeName, rval.stringify()), NO_SOURCE_SPAN);
        }
      }
    }
    return this.call(env, args);
  }

  stringify(): string {
    throw "illegal state: cannot stringify a callable";
  }

  abstract call(env: Environment, args: RVal[]): RVal;
}

function isRData(rval: RVal): rval is RData {
  return !rval.hasOwnProperty("call");
}

function isRNum(rval: RVal): rval is RNum {
  return rval instanceof RNum;
}

function isRCallable(rval: RVal): rval is RCallable {
  return "call" in rval;
}

abstract class RMath {
  static add(rnum1: RNum, rnum2: RNum): RNum {
    return new RNum(
      rnum1.numerator * rnum2.denominator + rnum1.denominator * rnum2.numerator,
      rnum1.denominator * rnum2.denominator
    );
  }
}

const R_EMPTY_LIST = new RList([]);
