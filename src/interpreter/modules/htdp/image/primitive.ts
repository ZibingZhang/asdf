import {
  RPrimProc,
  RValue,
} from "../../../rvalue";
import {
  Environment
} from "../../../environment";
import {
  SourceSpan
} from "../../../sourcespan";
import {
  ProcedureType
} from "../../../types";
import {
  RImage
} from "./rvalue";
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

  call(_: RValue[]): RValue {
    const element = <HTMLCanvasElement> document.createElement("canvas");
    element.width = 150;
    element.height = 100;
    const ctx = element.getContext("2d")!;
    ctx.fillStyle = "green";
    ctx.fillRect(0, 0, 150, 100);
    return new RImage(
      150, 100, element
    )
  }
}
