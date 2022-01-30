import {
  ColorType,
  Exact8BitNumberType
} from "../types";
import {
  RMath,
  RNumber,
  RPrimProc,
  RStruct,
  RValue
} from "../../../../rvalue";
import {
  ProcedureType
} from "../../../../types";

export {
  RPPMakeColor
};

class RPPMakeColor extends RPrimProc {
  constructor(alias: string | null = null) {
    super(alias || "make-color");
  }

  getType(args: number): ProcedureType {
    return new ProcedureType(new Array(Math.max(3, Math.min(4, args))).fill(new Exact8BitNumberType()), new ColorType());
  }

  call(args: RValue[]): RValue {
    const red = <RNumber>args[0];
    const green = <RNumber>args[1];
    const blue = <RNumber>args[2];
    const alpha = <RNumber>args[3] || RMath.make(true, 255n);
    return new RStruct("color", [red, green, blue, alpha]);
  }
}
