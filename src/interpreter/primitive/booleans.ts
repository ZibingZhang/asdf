import {
  AnyType,
  BooleanType,
  ProcedureType,
  StringType
} from "../types";
import {
  RBoolean,
  RPrimFun,
  RString,
  RValue,
  isRBoolean,
  toRBoolean
} from "../rvalue";

export {
  RPFBooleanToString,
  RPFAreBooleansEqual,
  RPFBooleanHuh,
  RPFFalseHuh,
  RPFNot
};

class RPFBooleanToString extends RPrimFun {
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

class RPFAreBooleansEqual extends RPrimFun {
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

class RPFBooleanHuh extends RPrimFun {
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

class RPFFalseHuh extends RPrimFun {
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

class RPFNot extends RPrimFun {
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
