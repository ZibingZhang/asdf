import {
  BACKGROUND_COLOR,
  HALF_OUTLINE_WIDTH,
  newCanvas,
  OUTLINE_MODE,
  OUTLINE_WIDTH,
  toRgb
} from "./common";
import {
  ColorType,
  ImageType,
  ModeType
} from "../types";
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
  RPPRectangle
};

class RPPRectangle extends RPrimProc {
  constructor() {
    super("rectangle");
  }

  getType(): ProcedureType {
    return new ProcedureType([new NonNegativeRealType(), new NonNegativeRealType(), new ModeType(), new ColorType()], new ImageType());
  }

  call(args: RValue[]): RValue {
    const width = Number((<RNumber>args[0]).numerator);
    const height = Number((<RNumber>args[1]).numerator);
    const mode = (<RSymbol>args[2]).val;
    const color = args[3];
    const [canvas, ctx] = newCanvas(width, height);
    ctx.fillStyle = toRgb(color);
    ctx.beginPath();
    if (
      mode === OUTLINE_MODE
      && width > OUTLINE_WIDTH
      && height > OUTLINE_WIDTH
    ) {
      ctx.rect(-HALF_OUTLINE_WIDTH, -HALF_OUTLINE_WIDTH, width + HALF_OUTLINE_WIDTH, height + HALF_OUTLINE_WIDTH);
      ctx.fill();
      ctx.fillStyle = BACKGROUND_COLOR;
      ctx.beginPath();
      ctx.rect(HALF_OUTLINE_WIDTH, HALF_OUTLINE_WIDTH, width - OUTLINE_WIDTH, height - OUTLINE_WIDTH);
      ctx.fill();
    } else {
      ctx.rect(0, 0, width, height);
      ctx.fill();
    }
    return new RImage(canvas);
  }
}
