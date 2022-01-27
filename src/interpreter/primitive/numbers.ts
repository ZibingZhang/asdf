import {
  AnyType,
  BooleanType,
  ExactNonNegativeIntegerType,
  ExactPositiveIntegerType,
  IntegerType,
  NumberLiteralType,
  NumberType,
  OrType,
  ProcedureType,
  RationalType,
  RealType,
  StringType
} from "../types";
import {
  FA_COMPLEX_NUMBERS_UNSUPPORTED_ERR,
  FA_DIV_BY_ZERO_ERR
} from "../error";
import {
  RExactReal,
  RInexactReal,
  RMath,
  RNumber,
  RPrimFun,
  RString,
  RValue,
  R_FALSE,
  R_TRUE,
  isRExactReal,
  isRInexactReal,
  isRInteger,
  isRNumber,
  toRBoolean
} from "../rvalue";
import {
  RNG
} from "../random";
import {
  SourceSpan
} from "../sourcespan";
import {
  StageError
} from "../pipeline";

export {
  RPFMultiply,
  RPFPlus,
  RPFMinus,
  RPFDivide,
  RPFLess,
  RPFLessEqual,
  RPFEqual,
  RPFGreater,
  RPFGreaterEqual,
  RPFAbs,
  RPFAdd1,
  RPFCeiling,
  RPFCurrentSeconds,
  RPFDenominator,
  RPC_E,
  RPFEvenHuh,
  RPFExactToInexact,
  RPFExp,
  RPFExpt,
  RPFFloor,
  RPFInexactToExact,
  RPFInexactHuh,
  RPFIntegerHuh,
  RPFMax,
  RPFMin,
  RPFModulo,
  RPFNegativeHuh,
  RPFNumberToString,
  RPFNumerator,
  RPFNumberHuh,
  RPFOddHuh,
  RPC_PI,
  RPFPositiveHuh,
  RPFQuotient,
  RPFRandom,
  RPFRemainder,
  RPFRound,
  RPFSgn,
  RPFSqr,
  RPFSqrt,
  RPFSub1,
  RPFZeroHuh
};

const RPC_E = new RInexactReal(6121026514868073n, 2251799813685248n);
const RPC_PI = new RInexactReal(884279719003555n, 281474976710656n);

class RPFMultiply extends RPrimFun {
  constructor() {
    super("*", { minArity: 2, relaxedMinArity: 0 });
  }

  getType(args: number): ProcedureType {
    return new ProcedureType(new Array(args).fill(new NumberType()), new NumberType());
  }

  call(args: RValue[]): RValue {
    return args.reduce(
      (prev, curr) => RMath.mul(<RNumber>prev, <RNumber>curr), new RExactReal(1n)
    );
  }
}

class RPFPlus extends RPrimFun {
  constructor() {
    super("+", { minArity: 2, relaxedMinArity: 0 });
  }

  getType(args: number): ProcedureType {
    return new ProcedureType(new Array(args).fill(new NumberType()), new NumberType());
  }

  call(args: RValue[]): RValue {
    return args.reduce(
      (prev, curr) => RMath.add(<RNumber>prev, <RNumber>curr), new RExactReal(0n)
    );
  }
}

class RPFMinus extends RPrimFun {
  constructor() {
    super("-", { minArity: 1 });
  }

  getType(args: number): ProcedureType {
    return new ProcedureType(new Array(args).fill(new NumberType()), new NumberType());
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
    super("/", { minArity: 2, relaxedMinArity: 0 });
  }

  getType(args: number): ProcedureType {
    return new ProcedureType(new Array(args).fill(new NumberType()), new NumberType());
  }

  call(args: RValue[], sourceSpan: SourceSpan): RValue {
    if (args.length === 1) {
      if ((<RNumber>args[0]).isZero()) {
        throw new StageError(
          FA_DIV_BY_ZERO_ERR,
          sourceSpan
        );
      }
      return RMath.div(RMath.make(true, 1n), <RNumber>args[0]);
    } else {
      return args.slice(1).reduce(
        (prev, curr) => {
          if ((<RNumber>curr).isZero()) {
            throw new StageError(
              FA_DIV_BY_ZERO_ERR,
              sourceSpan
            );
          }
          return RMath.div(<RNumber>prev, <RNumber>curr);
        },
        args[0]
      );
    }
  }
}

class RPFLess extends RPrimFun {
  constructor() {
    super("<", { minArity: 1 });
  }

  getType(args: number): ProcedureType {
    return new ProcedureType(new Array(args).fill(new RealType()), new BooleanType());
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

class RPFLessEqual extends RPrimFun {
  constructor() {
    super("<=", { minArity: 1 });
  }

  getType(args: number): ProcedureType {
    return new ProcedureType(new Array(args).fill(new RealType()), new BooleanType());
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
    super("=", { minArity: 1 });
  }

  getType(args: number): ProcedureType {
    return new ProcedureType(new Array(args).fill(new NumberType()), new BooleanType());
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
    super(">", { minArity: 1 });
  }

  getType(args: number): ProcedureType {
    return new ProcedureType(new Array(args).fill(new RealType()), new BooleanType());
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

class RPFGreaterEqual extends RPrimFun {
  constructor() {
    super(">=", { minArity: 1 });
  }

  getType(args: number): ProcedureType {
    return new ProcedureType(new Array(args).fill(new RealType()), new BooleanType());
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
    super("abs");
  }

  getType(): ProcedureType {
    return new ProcedureType([new RealType()], new RealType());
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
    super("add1");
  }

  getType(): ProcedureType {
    return new ProcedureType([new NumberType()], new NumberType());
  }

  call(args: RValue[]): RValue {
    return RMath.add(<RNumber>args[0], new RExactReal(1n));
  }
}

class RPFCeiling extends RPrimFun {
  constructor() {
    super("ceiling");
  }

  getType(): ProcedureType {
    return new ProcedureType([new RealType()], new IntegerType());
  }

  call(args: RValue[]): RValue {
    return RMath.ceil(<RNumber>args[0]);
  }
}

class RPFCurrentSeconds extends RPrimFun {
  constructor() {
    super("current-seconds");
  }

  getType(): ProcedureType {
    return new ProcedureType([], new ExactNonNegativeIntegerType());
  }

  call(_: RValue[]): RValue {
    return RMath.make(true, BigInt(Math.floor(new Date().getTime() / 1000)));
  }
}

class RPFDenominator extends RPrimFun {
  constructor() {
    super("denominator");
  }

  getType(): ProcedureType {
    return new ProcedureType([new RationalType()], new IntegerType());
  }

  call(args: RValue[]): RValue {
    const number = <RNumber>args[0];
    return RMath.make(isRExactReal(number), number.denominator);
  }
}

class RPFEvenHuh extends RPrimFun {
  constructor() {
    super("even?");
  }

  getType(): ProcedureType {
    return new ProcedureType([new IntegerType()], new BooleanType());
  }

  call(args: RValue[]): RValue {
    return toRBoolean((<RNumber>args[0]).numerator % 2n === 0n);
  }
}

class RPFExactToInexact extends RPrimFun {
  constructor() {
    super("exact->inexact");
  }

  getType(): ProcedureType {
    return new ProcedureType([new NumberType()], new NumberType());
  }

  call(args: RValue[]): RValue {
    return RMath.toInexact(<RNumber>args[0]);
  }
}

class RPFExp extends RPrimFun {
  constructor() {
    super("exp");
  }

  getType(): ProcedureType {
    return new ProcedureType([new NumberType()], new NumberType());
  }

  call(args: RValue[]): RValue {
    return RMath.pow(RPC_E, <RNumber>args[0]);
  }
}

class RPFExpt extends RPrimFun {
  constructor() {
    super("expt");
  }

  getType(): ProcedureType {
    return new ProcedureType([new NumberType(), new NumberType()], new NumberType());
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
    super("floor");
  }

  getType(): ProcedureType {
    return new ProcedureType([new RealType()], new IntegerType());
  }

  call(args: RValue[]): RValue {
    return RMath.floor(<RNumber>args[0]);
  }
}

class RPFInexactToExact extends RPrimFun {
  constructor() {
    super("inexact->exact");
  }

  getType(): ProcedureType {
    return new ProcedureType([new NumberType()], new NumberType());
  }

  call(args: RValue[]): RValue {
    return RMath.toExact(<RNumber>args[0]);
  }
}

class RPFInexactHuh extends RPrimFun {
  constructor() {
    super("inexact?");
  }

  getType(): ProcedureType {
    return new ProcedureType([new NumberType()], new BooleanType());
  }

  call(args: RValue[]): RValue {
    return toRBoolean(isRInexactReal(args[0]));
  }
}

class RPFIntegerHuh extends RPrimFun {
  constructor() {
    super("integer?");
  }

  getType(): ProcedureType {
    return new ProcedureType([new AnyType()], new BooleanType());
  }

  call(args: RValue[]): RValue {
    return toRBoolean(isRInteger(args[0]));
  }
}

class RPFMax extends RPrimFun {
  constructor() {
    super("max", { minArity: 1 });
  }

  getType(args: number): ProcedureType {
    return new ProcedureType(new Array(args).fill(new RealType()), new RealType());
  }

  call(args: RValue[]): RValue {
    return args.slice(1).reduce(
      (prev, curr) => (<RNumber>prev).toDecimal() > (<RNumber>curr).toDecimal() ? prev : curr, args[0]
    );
  }
}

class RPFMin extends RPrimFun {
  constructor() {
    super("min", { minArity: 1 });
  }

  getType(args: number): ProcedureType {
    return new ProcedureType(new Array(args).fill(new RealType()), new RealType());
  }

  call(args: RValue[]): RValue {
    return args.slice(1).reduce(
      (prev, curr) => (<RNumber>prev).toDecimal() < (<RNumber>curr).toDecimal() ? prev : curr, args[0]
    );
  }
}

class RPFModulo extends RPrimFun {
  constructor() {
    super("modulo");
  }

  getType(): ProcedureType {
    return new ProcedureType([new IntegerType(), new IntegerType()], new IntegerType());
  }

  call(args: RValue[]): RValue {
    const dividend = (<RNumber>args[0]).numerator;
    const divisor = (<RNumber>args[1]).numerator;
    const isExact = isRExactReal(<RNumber>args[0]) && isRExactReal(<RNumber>args[1]);
    if (dividend > 0 && divisor < 0) {
      return RMath.make(isExact, dividend % divisor + divisor);
    } else {
      return RMath.make(isExact, dividend % divisor);
    }
  }
}

class RPFNegativeHuh extends RPrimFun {
  constructor() {
    super("negative?");
  }

  getType(): ProcedureType {
    return new ProcedureType([new RealType()], new BooleanType());
  }

  call(args: RValue[]): RValue {
    return toRBoolean((<RNumber>args[0]).isNegative());
  }
}

class RPFNumberToString extends RPrimFun {
  constructor() {
    super("number->string");
  }

  getType(): ProcedureType {
    return new ProcedureType([new NumberType()], new StringType());
  }

  call(args: RValue[]): RValue {
    return new RString(RMath.toExact(<RNumber>args[0]).stringify());
  }
}

class RPFNumberHuh extends RPrimFun {
  constructor(alias?: string) {
    super(alias || "number?");
  }

  getType(): ProcedureType {
    return new ProcedureType([new AnyType()], new BooleanType());
  }

  call(args: RValue[]): RValue {
    return toRBoolean(isRNumber(args[0]));
  }
}

class RPFNumerator extends RPrimFun {
  constructor() {
    super("numerator");
  }

  getType(): ProcedureType {
    return new ProcedureType([new RationalType()], new IntegerType());
  }

  call(args: RValue[]): RValue {
    const number = <RNumber>args[0];
    return RMath.make(isRExactReal(number), number.numerator);
  }
}

class RPFOddHuh extends RPrimFun {
  constructor() {
    super("odd?");
  }

  getType(): ProcedureType {
    return new ProcedureType([new IntegerType()], new BooleanType());
  }

  call(args: RValue[]): RValue {
    return toRBoolean((<RNumber>args[0]).numerator % 2n === 1n);
  }
}

class RPFPositiveHuh extends RPrimFun {
  constructor() {
    super("positive?");
  }


  getType(): ProcedureType {
    return new ProcedureType([new RealType()], new BooleanType());
  }

  call(args: RValue[]): RValue {
    return toRBoolean((<RNumber>args[0]).isPositive());
  }
}

class RPFQuotient extends RPrimFun {
  constructor() {
    super("quotient");
  }

  getType(): ProcedureType {
    return new ProcedureType([new IntegerType(), new IntegerType()], new IntegerType());
  }

  call(args: RValue[]): RValue {
    const dividend = <RNumber>args[0];
    const divisor = <RNumber>args[1];
    const isExact = isRExactReal(dividend) && isRExactReal(divisor);
    return RMath.make(isExact, dividend.numerator / divisor.numerator);
  }
}

class RPFRandom extends RPrimFun {
  constructor() {
    super("random");
  }

  getType(): ProcedureType {
    return new ProcedureType([new ExactPositiveIntegerType()], new ExactNonNegativeIntegerType());
  }

  call(args: RValue[]): RValue {
    return new RExactReal(BigInt(Math.floor(RNG.next() * Number((<RExactReal>args[0]).numerator))));
  }
}

class RPFRemainder extends RPrimFun {
  constructor() {
    super("remainder");
  }

  getType(): ProcedureType {
    return new ProcedureType([new IntegerType(), new IntegerType()], new IntegerType());
  }

  call(args: RValue[]): RValue {
    const dividend = <RNumber>args[0];
    const divisor = <RNumber>args[1];
    const isExact = isRExactReal(dividend) && isRExactReal(divisor);
    return RMath.make(isExact, dividend.numerator - divisor.numerator * (dividend.numerator / divisor.numerator));
  }
}

class RPFRound extends RPrimFun {
  constructor() {
    super("round");
  }

  getType(): ProcedureType {
    return new ProcedureType([new RealType()], new IntegerType());
  }

  call(args: RValue[]): RValue {
    const number = <RNumber>args[0];
    const isExact = isRExactReal(number);
    if (number.denominator === 2n) {
      if ((number.numerator / 2n) % 2n === 0n) {
        return RMath.make(isExact, number.numerator / number.denominator);
      } else {
        return RMath.make(isExact, number.numerator / number.denominator + 1n);
      }
    } else {
      if (number.numerator - number.denominator * (number.numerator / number.denominator) < number.denominator) {
        return RMath.make(isExact, number.numerator / number.denominator);
      } else {
        return RMath.make(isExact, number.numerator / number.denominator + 1n);
      }
    }
  }
}

class RPFSqr extends RPrimFun {
  expt = new RExactReal(2n);

  constructor() {
    super("sqr");
  }

  getType(): ProcedureType {
    return new ProcedureType([new NumberType()], new NumberType());
  }

  call(args: RValue[]): RValue {
    return RMath.pow(<RNumber>args[0], this.expt);
  }
}

class RPFSgn extends RPrimFun {
  constructor() {
    super("sgn");
  }

  getType(): ProcedureType {
    return new ProcedureType([new RealType()], new OrType(new NumberLiteralType(new RExactReal(1n)), new NumberLiteralType(new RInexactReal(1n)), new NumberLiteralType(new RExactReal(0n)), new NumberLiteralType(new RInexactReal(0n)), new NumberLiteralType(new RExactReal(-1n)), new NumberLiteralType(new RInexactReal(-1n))));
  }

  call(args: RValue[]): RValue {
    const number = <RNumber>args[0];
    const isExact = isRExactReal(number);
    if (number.isPositive()) {
      return RMath.make(isExact, 1n);
    } else if (number.isNegative()) {
      return RMath.make(isExact, -1n);
    } else {
      return RMath.make(isExact, 0n);
    }
  }
}

class RPFSqrt extends RPrimFun {
  expt = new RExactReal(1n, 2n);

  constructor() {
    super("sqrt");
  }

  getType(): ProcedureType {
    return new ProcedureType([new NumberType()], new NumberType());
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
    super("sub1");
  }

  getType(): ProcedureType {
    return new ProcedureType([new NumberType()], new NumberType());
  }

  call(args: RValue[]): RValue {
    return RMath.sub(<RNumber>args[0], new RExactReal(1n));
  }
}

class RPFZeroHuh extends RPrimFun {
  constructor() {
    super("zero?");
  }

  getType(): ProcedureType {
    return new ProcedureType([new NumberType()], new BooleanType());
  }


  call(args: RValue[]): RValue {
    return toRBoolean((<RNumber>args[0]).isZero());
  }
}
