import {
  FA_DIV_BY_ZERO_ERR
} from "../error.js";
import {
  StageError
} from "../pipeline.js";
import {
  RMath,
  RNumber,
  RPrimFun,
  RValue,
  R_FALSE,
  R_TRUE
} from "../rvalue.js";
import {
  SourceSpan
} from "../sourcespan.js";

export {
  RPFMultiply,
  RPFPlus,
  RPFMinus,
  RPFDivide,
  R_E,
  RPFIsZero,
  R_PI
};

const R_E = new RNumber(6121026514868073n, 2251799813685248n);
const R_PI = new RNumber(884279719003555n, 281474976710656n);

class RPFMultiply extends RPrimFun {
  constructor() {
    super("*", { minArity: 2, allArgsTypeName: "number" });
  }

  call(args: RValue[]): RValue {
    return args.reduce(
      (prev, curr) => RMath.mul(<RNumber>prev, <RNumber>curr), new RNumber(1n, 1n)
    );
  }
}

class RPFPlus extends RPrimFun {
  constructor() {
    super("+", { minArity: 2, allArgsTypeName: "number" });
  }

  call(args: RValue[]): RValue {
    return args.reduce(
      (prev, curr) => RMath.add(<RNumber>prev, <RNumber>curr), new RNumber(0n, 1n)
    );
  }
}

class RPFMinus extends RPrimFun {
  constructor() {
    super("-", { minArity: 1, allArgsTypeName: "number" });
  }

  call(args: RValue[]): RValue {
    if (args.length === 1) {
      return RMath.negate(<RNumber>args[0]);
    }
    return args.slice(1).reduce(
      (prev, curr) => RMath.sub(<RNumber>prev, <RNumber>curr), args[0]
    );
  }
}

class RPFDivide extends RPrimFun {
  constructor() {
    super("/", { minArity: 2, allArgsTypeName: "number" });
  }

  call(args: RValue[], sourceSpan: SourceSpan): RValue {
    return args.slice(1).reduce(
      (prev, curr) => {
        if ((<RNumber>curr).numerator === 0n) {
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

class RPFIsZero extends RPrimFun {
  constructor() {
    super("zero?", { arity: 1, onlyArgTypeName: "number" });
  }

  call(args: RValue[]): RValue {
    return (<RNumber>args[0]).numerator === 0n ? R_TRUE : R_FALSE;
  }
}
