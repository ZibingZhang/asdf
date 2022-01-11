import {
  FA_COMPLEX_NUMBERS_UNSUPPORTED_ERR,
  FA_DIV_BY_ZERO_ERR
} from "../error.js";
import {
  RExactReal,
  RInexactReal,
  RMath,
  RNumber,
  RPrimFun,
  RValue,
  R_FALSE,
  R_TRUE,
  TypeName,
  isRInteger,
  toRBoolean,
  isRInexactReal,
  isRExactReal,
  isRNumber,
  RString
} from "../rvalue.js";
import {
  RNG
} from "../random.js";
import {
  SourceSpan
} from "../sourcespan.js";
import {
  StageError
} from "../pipeline.js";

export {
  RPFMultiply,
  RPFPlus,
  RPFMinus,
  RPFDivide,
  RPFLess,
  RPFLessThan,
  RPFEqual,
  RPFGreater,
  RPFGreaterThan,
  RPFAbs,
  RPFAdd1,
  RPFCeiling,
  RPFDenominator,
  RPC_E,
  RPFIsEven,
  RPFExactToInexact,
  RPFExp,
  RPFExpt,
  RPFFloor,
  RPFInexactToExact,
  RPFIsInexact,
  RPFIsInteger,
  RPFMax,
  RPFMin,
  RPFModulo,
  RPFIsNegative,
  RPFNumberToString,
  RPFNumerator,
  RPFIsNumber,
  RPFIsOdd,
  RPC_PI,
  RPFIsPositive,
  RPFQuotient,
  RPFRandom,
  RPFSqr,
  RPFSqrt,
  RPFSub1,
  RPFIsZero
};

const RPC_E = new RInexactReal(6121026514868073n, 2251799813685248n);
const RPC_PI = new RInexactReal(884279719003555n, 281474976710656n);

class RPFMultiply extends RPrimFun {
  constructor() {
    super("*", { minArity: 2, allArgsTypeName: TypeName.NUMBER });
  }

  call(args: RValue[]): RValue {
    return args.reduce(
      (prev, curr) => RMath.mul(<RNumber>prev, <RNumber>curr), new RExactReal(1n)
    );
  }
}

class RPFPlus extends RPrimFun {
  constructor() {
    super("+", { minArity: 2, allArgsTypeName: TypeName.NUMBER });
  }

  call(args: RValue[]): RValue {
    return args.reduce(
      (prev, curr) => RMath.add(<RNumber>prev, <RNumber>curr), new RExactReal(0n)
    );
  }
}

class RPFMinus extends RPrimFun {
  constructor() {
    super("-", { minArity: 1, allArgsTypeName: TypeName.NUMBER });
  }

  call(args: RValue[]): RValue {
    if (args.length === 1) {
      return (<RNumber>args[0]).negate();
    }
    return args.slice(1).reduce(
      (prev, curr) => RMath.sub(<RNumber>prev, <RNumber>curr), args[0]
    );
  }
}

class RPFDivide extends RPrimFun {
  constructor() {
    super("/", { minArity: 2, allArgsTypeName: TypeName.NUMBER });
  }

  call(args: RValue[], sourceSpan: SourceSpan): RValue {
    return args.slice(1).reduce(
      (prev, curr) => {
        if ((<RNumber>curr).isZero()) {
          throw new StageError(
            FA_DIV_BY_ZERO_ERR, sourceSpan
          );
        }
        return RMath.div(<RNumber>prev, <RNumber>curr);
      },
      args[0]
    );
  }
}

class RPFLess extends RPrimFun {
  constructor() {
    super("<", { minArity: 1, allArgsTypeName: TypeName.REAL });
  }

  call(args: RValue[]): RValue {
    for (let idx = 0; idx < args.length - 1; idx++) {
      if (!((<RNumber>args[idx]).toDecimal() < (<RNumber>args[idx + 1]).toDecimal())) {
        return R_FALSE;
      }
    }
    return R_TRUE;
  }
}

class RPFLessThan extends RPrimFun {
  constructor() {
    super("<=", { minArity: 1, allArgsTypeName: TypeName.REAL });
  }

  call(args: RValue[]): RValue {
    for (let idx = 0; idx < args.length - 1; idx++) {
      if (!((<RNumber>args[idx]).toDecimal() <= (<RNumber>args[idx + 1]).toDecimal())) {
        return R_FALSE;
      }
    }
    return R_TRUE;
  }
}

class RPFEqual extends RPrimFun {
  constructor() {
    super("=", { minArity: 1, allArgsTypeName: TypeName.REAL });
  }

  call(args: RValue[]): RValue {
    for (let idx = 0; idx < args.length - 1; idx++) {
      if (!((<RNumber>args[idx]).toDecimal() === (<RNumber>args[idx + 1]).toDecimal())) {
        return R_FALSE;
      }
    }
    return R_TRUE;
  }
}

class RPFGreater extends RPrimFun {
  constructor() {
    super(">", { minArity: 1, allArgsTypeName: TypeName.REAL });
  }

  call(args: RValue[]): RValue {
    for (let idx = 0; idx < args.length - 1; idx++) {
      if (!((<RNumber>args[idx]).toDecimal() > (<RNumber>args[idx + 1]).toDecimal())) {
        return R_FALSE;
      }
    }
    return R_TRUE;
  }
}

class RPFGreaterThan extends RPrimFun {
  constructor() {
    super(">=", { minArity: 1, allArgsTypeName: TypeName.REAL });
  }

  call(args: RValue[]): RValue {
    for (let idx = 0; idx < args.length - 1; idx++) {
      if (!((<RNumber>args[idx]).toDecimal() >= (<RNumber>args[idx + 1]).toDecimal())) {
        return R_FALSE;
      }
    }
    return R_TRUE;
  }
}

class RPFAbs extends RPrimFun {
  constructor() {
    super("abs", { arity: 1, onlyArgTypeName: TypeName.REAL });
  }

  call(args: RValue[]): RValue {
    const number = <RNumber>args[0];
    if (number.isNegative()) {
      return number.negate();
    } else {
      return number;
    }
  }
}

class RPFAdd1 extends RPrimFun {
  constructor() {
    super("add1", { arity: 1, onlyArgTypeName: TypeName.NUMBER });
  }

  call(args: RValue[]): RValue {
    return RMath.add(<RNumber>args[0], new RExactReal(1n));
  }
}

class RPFCeiling extends RPrimFun {
  constructor() {
    super("ceiling", { arity: 1, onlyArgTypeName: TypeName.REAL });
  }

  call(args: RValue[]): RValue {
    return RMath.ceil(<RNumber>args[0]);
  }
}

class RPFDenominator extends RPrimFun {
  constructor() {
    super("denominator", { arity: 1, onlyArgTypeName: TypeName.RATIONAL });
  }

  call(args: RValue[]): RValue {
    const number = <RNumber>args[0];
    return RMath.make(isRExactReal(number), number.denominator);
  }
}

class RPFIsEven extends RPrimFun {
  constructor() {
    super("even?", { arity: 1, onlyArgTypeName: TypeName.INTEGER });
  }

  call(args: RValue[]): RValue {
    return toRBoolean((<RNumber>args[0]).numerator % 2n === 0n);
  }
}

class RPFExactToInexact extends RPrimFun {
  constructor() {
    super("exact->inexact", { arity: 1, onlyArgTypeName: TypeName.NUMBER });
  }

  call(args: RValue[]): RValue {
    return RMath.toInexact(<RNumber>args[0]);
  }
}

class RPFExp extends RPrimFun {
  constructor() {
    super("exp", { arity: 1, onlyArgTypeName: TypeName.NUMBER });
  }

  call(args: RValue[]): RValue {
    return RMath.pow(RPC_E, <RNumber>args[0]);
  }
}

class RPFExpt extends RPrimFun {
  constructor() {
    super("expt", { arity: 2, allArgsTypeName: TypeName.NUMBER });
  }

  call(args: RValue[], sourceSpan: SourceSpan): RValue {
    const base = <RNumber>args[0];
    const expt = <RNumber>args[1];
    if (base.isNegative() && expt.denominator !== 1n) {
      throw new StageError(
        FA_COMPLEX_NUMBERS_UNSUPPORTED_ERR(this.name),
        sourceSpan
      );
    }
    return RMath.pow(base, expt);
  }
}

class RPFFloor extends RPrimFun {
  constructor() {
    super("floor", { arity: 1, onlyArgTypeName: TypeName.REAL });
  }

  call(args: RValue[]): RValue {
    return RMath.floor(<RNumber>args[0]);
  }
}

class RPFInexactToExact extends RPrimFun {
  constructor() {
    super("inexact->exact", { arity: 1, onlyArgTypeName: TypeName.NUMBER });
  }

  call(args: RValue[]): RValue {
    return RMath.toExact(<RNumber>args[0]);
  }
}

class RPFIsInexact extends RPrimFun {
  constructor() {
    super("inexact?", { arity: 1 });
  }

  call(args: RValue[]): RValue {
    return toRBoolean(isRInexactReal(args[0]));
  }
}

class RPFIsInteger extends RPrimFun {
  constructor() {
    super("integer?", { arity: 1 });
  }

  call(args: RValue[]): RValue {
    return toRBoolean(isRInteger(args[0]));
  }
}

class RPFMax extends RPrimFun {
  constructor() {
    super("max", { minArity: 1, allArgsTypeName: TypeName.REAL });
  }

  call(args: RValue[]): RValue {
    return args.slice(1).reduce(
      (prev, curr) => (<RNumber>prev).toDecimal() > (<RNumber>curr).toDecimal() ? prev : curr, args[0]
    );
  }
}

class RPFMin extends RPrimFun {
  constructor() {
    super("min", { minArity: 1, allArgsTypeName: TypeName.REAL });
  }

  call(args: RValue[]): RValue {
    return args.slice(1).reduce(
      (prev, curr) => (<RNumber>prev).toDecimal() < (<RNumber>curr).toDecimal() ? prev : curr, args[0]
    );
  }
}

class RPFModulo extends RPrimFun {
  constructor() {
    super("modulo", { arity: 2, allArgsTypeName: TypeName.INTEGER });
  }

  call(args: RValue[]): RValue {
    const dividend = (<RNumber>args[0]).numerator;
    const divisor = (<RNumber>args[1]).numerator;
    if (dividend > 0 && divisor < 0) {
      return new RExactReal(dividend % divisor + divisor);
    } else {
      return new RExactReal(dividend % divisor);
    }
  }
}

class RPFIsNegative extends RPrimFun {
  constructor() {
    super("negative?", { arity: 1, onlyArgTypeName: TypeName.REAL });
  }

  call(args: RValue[]): RValue {
    return toRBoolean((<RNumber>args[0]).isNegative());
  }
}

class RPFNumberToString extends RPrimFun {
  constructor() {
    super("number->string", { arity: 1, onlyArgTypeName: TypeName.NUMBER });
  }

  call(args: RValue[]): RValue {
    return new RString(RMath.toExact(<RNumber>args[0]).stringify());
  }
}

class RPFIsNumber extends RPrimFun {
  constructor(alias?: string) {
    super(alias || "number?", { arity: 1 });
  }

  call(args: RValue[]): RValue {
    return toRBoolean(isRNumber(args[0]));
  }
}

class RPFNumerator extends RPrimFun {
  constructor() {
    super("numerator", { arity: 1, onlyArgTypeName: TypeName.RATIONAL });
  }

  call(args: RValue[]): RValue {
    const number = <RNumber>args[0];
    return RMath.make(isRExactReal(number), number.numerator);
  }
}

class RPFIsOdd extends RPrimFun {
  constructor() {
    super("odd?", { arity: 1, onlyArgTypeName: TypeName.INTEGER });
  }

  call(args: RValue[]): RValue {
    return toRBoolean((<RNumber>args[0]).numerator % 2n === 1n);
  }
}

class RPFIsPositive extends RPrimFun {
  constructor() {
    super("positive?", { arity: 1, onlyArgTypeName: TypeName.REAL });
  }

  call(args: RValue[]): RValue {
    return toRBoolean((<RNumber>args[0]).isPositive());
  }
}

class RPFQuotient extends RPrimFun {
  constructor() {
    super("quotient", { arity: 2, allArgsTypeName: TypeName.INTEGER });
  }

  call(args: RValue[]): RValue {
    const dividend = <RNumber>args[0];
    const divisor = <RNumber>args[1];
    const isExact = isRExactReal(dividend) && isRExactReal(divisor);
    return RMath.make(isExact, dividend.numerator / divisor.numerator)
  }
}

class RPFRandom extends RPrimFun {
  constructor() {
    super("random", { arity: 1, onlyArgTypeName: TypeName.EXACT_POSITIVE_INTEGER });
  }

  call(args: RValue[]): RValue {
    return new RExactReal(BigInt(Math.floor(RNG.next() * Number((<RExactReal>args[0]).numerator))));
  }
}

class RPFSqr extends RPrimFun {
  expt = new RExactReal(2n);

  constructor() {
    super("sqr", { arity: 1, onlyArgTypeName: TypeName.NUMBER });
  }

  call(args: RValue[]): RValue {
    return RMath.pow(<RNumber>args[0], this.expt);
  }
}

class RPFSqrt extends RPrimFun {
  expt = new RExactReal(1n, 2n);

  constructor() {
    super("sqrt", { arity: 1, onlyArgTypeName: TypeName.NUMBER });
  }

  call(args: RValue[], sourceSpan: SourceSpan): RValue {
    const base = <RNumber>args[0];
    if (base.isNegative()) {
      throw new StageError(
        FA_COMPLEX_NUMBERS_UNSUPPORTED_ERR(this.name),
        sourceSpan
      );
    }
    return RMath.pow(base, this.expt);
  }
}

class RPFSub1 extends RPrimFun {
  constructor() {
    super("sub1", { arity: 1, onlyArgTypeName: TypeName.NUMBER });
  }

  call(args: RValue[]): RValue {
    return RMath.sub(<RNumber>args[0], new RExactReal(1n));
  }
}

class RPFIsZero extends RPrimFun {
  constructor() {
    super("zero?", { arity: 1, onlyArgTypeName: TypeName.NUMBER });
  }

  call(args: RValue[]): RValue {
    return toRBoolean((<RNumber>args[0]).isZero());
  }
}
