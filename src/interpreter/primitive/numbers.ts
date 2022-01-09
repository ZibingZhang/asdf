import {
  FA_COMPLEX_NUMBERS_UNSUPPORTED_ERR,
  FA_DIV_BY_ZERO_ERR
} from "../error.js";
import {
  NO_SOURCE_SPAN,
  SourceSpan
} from "../sourcespan.js";
import {
  RExactReal,
  RInexactRational,
  RMath,
  RNumber,
  RPrimFun,
  RValue,
  R_FALSE,
  R_TRUE,
  TypeName,
  isRDecimal,
  isRInteger,
  toRBoolean
} from "../rvalue.js";
import {
  RNG
} from "../random.js";
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
  RPC_E,
  RPFExp,
  RPFExpt,
  RPFIsInteger,
  RPC_PI,
  RPFRandom,
  RPFSqr,
  RPFSqrt,
  RPFSub1,
  RPFIsZero
};

const RPC_E = new RInexactRational(6121026514868073n, 2251799813685248n);
const RPC_PI = new RInexactRational(884279719003555n, 281474976710656n);

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
      if (!((<RNumber>args[idx]).toInexactDecimal().val < (<RNumber>args[idx + 1]).toInexactDecimal().val)) {
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
      if (!((<RNumber>args[idx]).toInexactDecimal().val <= (<RNumber>args[idx + 1]).toInexactDecimal().val)) {
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
      if (!((<RNumber>args[idx]).toInexactDecimal().val === (<RNumber>args[idx + 1]).toInexactDecimal().val)) {
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
      if (!((<RNumber>args[idx]).toInexactDecimal().val > (<RNumber>args[idx + 1]).toInexactDecimal().val)) {
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
      if (!((<RNumber>args[idx]).toInexactDecimal().val >= (<RNumber>args[idx + 1]).toInexactDecimal().val)) {
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

  call(args: RValue[]): RValue {
    const base = <RNumber>args[0];
    const expt = <RNumber>args[1];
    if (
      base.isNegative()
      && (isRDecimal(expt) || expt.denominator !== 1n)
    ) {
      throw new StageError(
        FA_COMPLEX_NUMBERS_UNSUPPORTED_ERR(this.name),
        NO_SOURCE_SPAN
      );
    }
    return RMath.pow(base, expt);
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

  call(args: RValue[]): RValue {
    const base = <RNumber>args[0];
    if (base.isNegative()) {
      throw new StageError(
        FA_COMPLEX_NUMBERS_UNSUPPORTED_ERR(this.name),
        NO_SOURCE_SPAN
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
