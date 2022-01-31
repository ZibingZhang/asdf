import {
  AnyType,
  BooleanType,
  ProcedureType
} from "../../../../values/types";
import {
  RPrimProc,
  RValue,
  toRBoolean
} from "../../../../values/rvalue";
import {
  isRImage
} from "../rvalue";

export {
  RPPImageHuh
};

class RPPImageHuh extends RPrimProc {
  constructor() {
    super("image?");
  }

  getType(): ProcedureType {
    return new ProcedureType([new AnyType()], new BooleanType());
  }

  call(args: RValue[]): RValue {
    return toRBoolean(isRImage(args[0]));
  }
}
