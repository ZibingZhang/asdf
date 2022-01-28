/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  NonNegativeRealType,
  ProcedureType
} from "../../../types";
import {
  RNumber,
  RPrimProc,
  RSymbol,
  RValue
} from "../../../rvalue";
import {
  ImageType, ModeType
} from "./types";
import {
  RImage
} from "./rvalue";

export {
  RPFRectangle
};

const OUTLINE_WIDTH = 2;

class RPFRectangle extends RPrimProc {
  constructor() {
    super("rectangle");
  }

  getType(): ProcedureType {
    return new ProcedureType([new NonNegativeRealType(), new NonNegativeRealType(), new ModeType()], new ImageType());
  }

  call(args: RValue[]): RValue {
    const width = Number((<RNumber>args[0]).numerator);
    const height = Number((<RNumber>args[1]).numerator);
    const mode = (<RSymbol>args[2]).val;
    const element = <HTMLCanvasElement> document.createElement("canvas");
    element.width = width;
    element.height = height;
    const ctx = element.getContext("2d")!;
    ctx.fillStyle = "green";
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.fill();
    if (
      mode === "outline"
      && width > OUTLINE_WIDTH
      && height > OUTLINE_WIDTH
    ) {
      ctx.beginPath();
      ctx.rect(OUTLINE_WIDTH, OUTLINE_WIDTH, width - 2 * OUTLINE_WIDTH, height - 2 * OUTLINE_WIDTH);
      ctx.fillStyle = "white";
      ctx.fill();
    }
    return new RImage(
      width, height, element
    );
  }
}
