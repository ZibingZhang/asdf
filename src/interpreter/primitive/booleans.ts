import {
  AnyType,
  BooleanType,
  ProcedureType,
  StringType
} from "../values/types";
import {
  RBoolean,
  RPrimProc,
  RString,
  RValue,
  isRBoolean,
  toRBoolean
} from "../values/rvalue";

export {
  RPPBooleanToString,
  RPPAreBooleansEqual,
  RPPBooleanHuh,
  RPPFalseHuh,
  RPPNot
};

class RPPBooleanToString extends RPrimProc {
  constructor() {
    super("boolean->string");
  }

  getType(): ProcedureType {
    return new ProcedureType([new BooleanType()], new StringType());
  }

  call(args: RValue[]): RValue {
    return (<RBoolean>args[0]).val ? new RString("#true") : new RString("#false");
  }
}

class RPPAreBooleansEqual extends RPrimProc {
  constructor() {
    super("boolean=?");
  }

  getType(): ProcedureType {
    return new ProcedureType([new BooleanType(), new BooleanType()], new BooleanType());
  }

  call(args: RValue[]): RValue {
    return toRBoolean(args[0] === args[1]);
  }
}

class RPPBooleanHuh extends RPrimProc {
  constructor() {
    super("boolean?");
  }

  getType(): ProcedureType {
    return new ProcedureType([new AnyType()], new BooleanType());
  }

  call(args: RValue[]): RValue {
    return toRBoolean(isRBoolean(args[0]));
  }
}

class RPPFalseHuh extends RPrimProc {
  constructor() {
    super("false?");
  }

  getType(): ProcedureType {
    return new ProcedureType([new AnyType()], new BooleanType());
  }

  call(args: RValue[]): RValue {
    return toRBoolean((<RBoolean>args[0]).val === false);
  }
}

class RPPNot extends RPrimProc {
  constructor() {
    super("not");
  }

  getType(): ProcedureType {
    return new ProcedureType([new BooleanType()], new BooleanType());
  }

  call(args: RValue[]): RValue {
    return toRBoolean(!(<RBoolean>args[0]).val);
  }
}
