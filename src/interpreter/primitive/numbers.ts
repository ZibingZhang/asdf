import {
  FA_DIV_BY_ZERO_ERR
} from "../error.js";
import {
  StageError
} from "../pipeline.js";
import {
  RExactReal,
  RInexactRational,
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
  RPFLess,
  RPFLessThan,
  RPFEqual,
  RPFGreater,
  RPFGreaterThan,
  RPFAbs,
  RPFAdd1,
  RPC_E,
  RPC_PI,
  RPFSub1,
  RPFIsZero
};

const RPC_E = new RInexactRational(6121026514868073n, 2251799813685248n);
const RPC_PI = new RInexactRational(884279719003555n, 281474976710656n);

class RPFMultiply extends RPrimFun {
  constructor() {
    super("*", { minArity: 2, allArgsTypeName: "number" });
  }

  call(args: RValue[]): RValue {
    return args.reduce(
      (prev, curr) => RMath.mul(<RNumber>prev, <RNumber>curr), new RExactReal(1n, 1n)
    );
  }
}

class RPFPlus extends RPrimFun {
  constructor() {
    super("+", { minArity: 2, allArgsTypeName: "number" });
  }

  call(args: RValue[]): RValue {
    return args.reduce(
      (prev, curr) => RMath.add(<RNumber>prev, <RNumber>curr), new RExactReal(0n, 1n)
    );
  }
}

class RPFMinus extends RPrimFun {
  constructor() {
    super("-", { minArity: 1, allArgsTypeName: "number" });
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
    super("/", { minArity: 2, allArgsTypeName: "number" });
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
    super("<", { minArity: 1, allArgsTypeName: "real" });
  }

  call(args: RValue[]): RValue {
    for (let idx = 0; idx < args.length - 1; idx++) {
      if (!((<RNumber>args[idx]).toInexactDecimal().value < (<RNumber>args[idx + 1]).toInexactDecimal().value)) {
        return R_FALSE;
      }
    }
    return R_TRUE;
  }
}

class RPFLessThan extends RPrimFun {
  constructor() {
    super("<=", { minArity: 1, allArgsTypeName: "real" });
  }

  call(args: RValue[]): RValue {
    for (let idx = 0; idx < args.length - 1; idx++) {
      if (!((<RNumber>args[idx]).toInexactDecimal().value <= (<RNumber>args[idx + 1]).toInexactDecimal().value)) {
        return R_FALSE;
      }
    }
    return R_TRUE;
  }
}

class RPFEqual extends RPrimFun {
  constructor() {
    super("=", { minArity: 1, allArgsTypeName: "real" });
  }

  call(args: RValue[]): RValue {
    for (let idx = 0; idx < args.length - 1; idx++) {
      if (!((<RNumber>args[idx]).toInexactDecimal().value === (<RNumber>args[idx + 1]).toInexactDecimal().value)) {
        return R_FALSE;
      }
    }
    return R_TRUE;
  }
}

class RPFGreater extends RPrimFun {
  constructor() {
    super(">", { minArity: 1, allArgsTypeName: "real" });
  }

  call(args: RValue[]): RValue {
    for (let idx = 0; idx < args.length - 1; idx++) {
      if (!((<RNumber>args[idx]).toInexactDecimal().value > (<RNumber>args[idx + 1]).toInexactDecimal().value)) {
        return R_FALSE;
      }
    }
    return R_TRUE;
  }
}

class RPFGreaterThan extends RPrimFun {
  constructor() {
    super(">=", { minArity: 1, allArgsTypeName: "real" });
  }

  call(args: RValue[]): RValue {
    for (let idx = 0; idx < args.length - 1; idx++) {
      if (!((<RNumber>args[idx]).toInexactDecimal().value >= (<RNumber>args[idx + 1]).toInexactDecimal().value)) {
        return R_FALSE;
      }
    }
    return R_TRUE;
  }
}

class RPFAbs extends RPrimFun {
  constructor() {
    super("abs", { arity: 1, onlyArgTypeName: "real" });
  }

  call(args: RValue[]): RValue {
    const number = <RNumber>args[0];
    if (number.toInexactDecimal().value < 0) {
      return number.negate();
    } else {
      return number;
    }
  }
}

class RPFAdd1 extends RPrimFun {
  constructor() {
    super("add1", { arity: 1, onlyArgTypeName: "number" });
  }

  call(args: RValue[]): RValue {
    return RMath.add(<RNumber>args[0], new RExactReal(1n, 1n));
  }
}

class RPFSub1 extends RPrimFun {
  constructor() {
    super("sub1", { arity: 1, onlyArgTypeName: "number" });
  }

  call(args: RValue[]): RValue {
    return RMath.add(<RNumber>args[0], new RExactReal(1n, 1n));
  }
}

class RPFIsZero extends RPrimFun {
  constructor() {
    super("zero?", { arity: 1, onlyArgTypeName: "number" });
  }

  call(args: RValue[]): RValue {
    return (<RNumber>args[0]).isZero() ? R_TRUE : R_FALSE;
  }
}
