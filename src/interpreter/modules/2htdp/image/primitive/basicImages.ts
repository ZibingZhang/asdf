import {
  ColorType,
  ImageType,
  ModeType
} from "../types";
import {
  BACKGROUND_COLOR,
  newCanvas,
  OUTLINE_MODE,
  OUTLINE_WIDTH,
  TAU,
  toRgb
} from "./common";
import {
  NonNegativeRealType,
  ProcedureType
} from "../../../../types";
import {
  RNumber,
  RPrimProc,
  RSymbol,
  RValue
} from "../../../../rvalue";
import {
  RImage
} from "../rvalue";

export {
  RPPCircle
};



class RPPCircle extends RPrimProc {
  constructor() {
    super("circle");
  }

  getType(): ProcedureType {
    return new ProcedureType([new NonNegativeRealType(), new ModeType(), new ColorType()], new ImageType());
  }

  call(args: RValue[]): RValue {
    const radius = Number((<RNumber>args[0]).numerator);
    const mode = (<RSymbol>args[1]).val;
    const color = args[2];
    const [canvas, ctx] = newCanvas(2 * radius, 2 * radius);
    ctx.fillStyle = toRgb(color);
    ctx.beginPath();
    ctx.arc(radius, radius, radius, 0, TAU);
    ctx.fill();
    if (
      mode === OUTLINE_MODE
      && radius > OUTLINE_WIDTH
    ) {
      ctx.fillStyle = BACKGROUND_COLOR;
      ctx.beginPath();
      const adjRadius = radius - OUTLINE_WIDTH;
      ctx.arc(radius, radius, adjRadius, 0, TAU);
      ctx.fill();
    }
    return new RImage(canvas);
  }
}
