import {
  AnyType,
  BooleanType,
  ErrorType,
  NonNegativeRealType,
  NumberType,
  ProcedureType
} from "../types";
import {
  REofObject,
  RNumber,
  RPrimProc,
  RValue,
  isRData,
  isREofObject,
  isRString,
  isRStruct,
  isRSymbol,
  toRBoolean
} from "../rvalue";

export {
  RPFAreWithin,
  RPC_EOF,
  RPFEofObjectHuh,
  RPFAreEq,
  RPFAreEqual,
  RPFAreEqualWithin,
  RPFAreEqv,
  RPFError,
  RPFIdentity,
  RPFStructHuh,
  UserError
};

class UserError extends Error {}

const RPC_EOF = new REofObject();

class RPFAreWithin extends RPrimProc {
  constructor() {
    super("=~");
  }

  getType(): ProcedureType {
    return new ProcedureType([new NumberType(), new NumberType(), new NonNegativeRealType()], new BooleanType());
  }

  call(args: RValue[]): RValue {
    return toRBoolean((<RNumber>args[0]).equalWithin(<RNumber>args[1], (<RNumber>args[2]).toDecimal()));
  }
}

class RPFEofObjectHuh extends RPrimProc {
  constructor() {
    super("eof-object?");
  }

  getType(): ProcedureType {
    return new ProcedureType([new AnyType()], new BooleanType());
  }

  call(args: RValue[]): RValue {
    return toRBoolean(isREofObject(args[0]));
  }
}

class RPFAreEq extends RPrimProc {
  constructor() {
    super("eq?");
  }

  getType(): ProcedureType {
    return new ProcedureType([new AnyType(), new AnyType()], new BooleanType());
  }

  call(args: RValue[]): RValue {
    return toRBoolean(isRData(args[0]) && args[0].eq(args[1]));
  }
}

class RPFAreEqual extends RPrimProc {
  constructor() {
    super("equal?");
  }

  getType(): ProcedureType {
    return new ProcedureType([new AnyType(), new AnyType()], new BooleanType());
  }

  call(args: RValue[]): RValue {
    return toRBoolean(isRData(args[0]) && args[0].equal(args[1]));
  }
}

class RPFAreEqualWithin extends RPrimProc {
  constructor() {
    super("equal~?");
  }

  getType(): ProcedureType {
    return new ProcedureType([new AnyType(), new AnyType(), new NonNegativeRealType()], new BooleanType());
  }

  call(args: RValue[]): RValue {
    const ep = (<RNumber>args[2]).toDecimal();
    return toRBoolean(isRData(args[0]) && args[0].equalWithin(args[1], ep));
  }
}

class RPFAreEqv extends RPrimProc {
  constructor() {
    super("eqv?");
  }

  getType(): ProcedureType {
    return new ProcedureType([new AnyType(), new AnyType()], new BooleanType());
  }

  call(args: RValue[]): RValue {
    return toRBoolean(isRData(args[0]) && args[0].eqv(args[1]));
  }
}

class RPFError extends RPrimProc {
  constructor() {
    super("error", {});
  }

  getType(args: number): ProcedureType {
    return new ProcedureType(new Array(args).fill(new AnyType()), new ErrorType());
  }

  call(args: RValue[]): RValue {
    let message = "";
    for (const arg of args) {
      if (isRString(arg)) {
        message += arg.val;
      } else if (isRSymbol(arg)) {
        message += `${arg}: `;
      } else {
        message += arg.stringify();
      }
    }
    throw new UserError(message);
  }
}

class RPFIdentity extends RPrimProc {
  constructor() {
    super("identity");
  }

  getType(): ProcedureType {
    return new ProcedureType([new AnyType()], new AnyType());
  }

  call(args: RValue[]): RValue {
    return args[0];
  }
}

class RPFStructHuh extends RPrimProc {
  constructor() {
    super("struct?");
  }

  getType(): ProcedureType {
    return new ProcedureType([new AnyType()], new BooleanType());
  }

  call(args: RValue[]): RValue {
    return toRBoolean(isRStruct(args[0]));
  }
}
