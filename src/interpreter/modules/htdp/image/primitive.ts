import {
  Environment
} from "../../../environment";
import {
  RPrimProc,
  RValue,
  R_TRUE
} from "../../../rvalue";
import { SourceSpan } from "../../../sourcespan";
import {
  ProcedureType
} from "../../../types";
import {
  ImageType
} from "./types";

export {
  RPFSquare
};

class RPFSquare extends RPrimProc {
  constructor() {
    super("square");
  }

  getType(): ProcedureType {
    return new ProcedureType([], new ImageType());
  }

  call(_: RValue[], __: SourceSpan, ___: Environment): RValue {
    return R_TRUE;
  }
}
