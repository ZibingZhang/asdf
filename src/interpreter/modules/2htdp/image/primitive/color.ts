import {
  ColorType,
  Exact8BitIntegerType
} from "../types";
import {
  RNumber,
  RPrimProc,
  RStruct,
  RValue
} from "../../../../values/rvalue";
import {
  ProcedureType
} from "../../../../values/types";
import { RMath } from "../../../../values/rmath";

export {
  RPPMakeColor
};

class RPPMakeColor extends RPrimProc {
  constructor(alias: string | null = null) {
    super(alias || "make-color");
  }

  getType(args: number): ProcedureType {
    return new ProcedureType(new Array(Math.max(3, Math.min(4, args))).fill(new Exact8BitIntegerType()), new ColorType());
  }

  call(args: RValue[]): RValue {
    const red = <RNumber>args[0];
    const green = <RNumber>args[1];
    const blue = <RNumber>args[2];
    const alpha = <RNumber>args[3] || RMath.make(true, 255n);
    return new RStruct("color", [red, green, blue, alpha]);
  }
}
