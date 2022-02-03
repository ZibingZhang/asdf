import {
  isRExactReal,
  RExactReal,
  RInexactReal,
  RNumber
} from "./rvalue";

export {
  RMath
};

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
