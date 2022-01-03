export {
  RBool,
  RNum,
  RPrimFun,
  RString,
  RVal
};

// https://stackoverflow.com/questions/17445231/js-how-to-find-the-greatest-common-divisor
function gcd(a: bigint, b: bigint): bigint {
  if (!b) {
     return a;
  }
  return gcd(b, a % b);
}

interface RVal {
  stringify(): string;
}

interface RAtomic extends RVal {}

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

interface RCallable extends RVal {
  eval(args: RVal[]): RVal;
}

class RPrimFun implements RCallable {
  constructor(readonly fn: (args: RVal[]) => RVal) {}

  eval(args: RVal[]): RVal {
    return this.fn(args);
  }

  stringify(): string {
    throw "Illegal state";
  }
}
