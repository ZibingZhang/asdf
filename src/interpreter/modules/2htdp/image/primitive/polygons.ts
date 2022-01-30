import {
  BACKGROUND_COLOR,
  HALF_OUTLINE_WIDTH,
  OUTLINE_WIDTH,
  isOutlineMode,
  newCanvas,
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
  RImage,
  RMode
} from "../rvalue";
import {
  RNumber,
  RPrimProc,
  RValue
} from "../../../../rvalue";

export {
  RPPSquare,
  RPPRectangle
};

class RPPSquare extends RPrimProc {
  constructor() {
    super("square");
  }

  getType(): ProcedureType {
    return new ProcedureType([new NonNegativeRealType(), new ModeType(), new ColorType()], new ImageType());
  }

  call(args: RValue[]): RValue {
    const side = Number((<RNumber>args[0]).numerator);
    const mode = <RMode>args[1];
    const color = args[2];
    const [canvas, ctx] = newCanvas(side, side);
    ctx.fillStyle = toRgb(color, mode);
    ctx.beginPath();
    if (
      isOutlineMode(mode)
      && side > OUTLINE_WIDTH
    ) {
      ctx.rect(-HALF_OUTLINE_WIDTH, -HALF_OUTLINE_WIDTH, side + HALF_OUTLINE_WIDTH, side + HALF_OUTLINE_WIDTH);
      ctx.fill();
      ctx.fillStyle = BACKGROUND_COLOR;
      ctx.beginPath();
      ctx.rect(HALF_OUTLINE_WIDTH, HALF_OUTLINE_WIDTH, side - OUTLINE_WIDTH, side - OUTLINE_WIDTH);
      ctx.fill();
    } else {
      ctx.rect(0, 0, side, side);
      ctx.fill();
    }
    return new RImage(canvas);
  }
}

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
    const mode = <RMode>args[2];
    const color = args[3];
    const [canvas, ctx] = newCanvas(width, height);
    ctx.fillStyle = toRgb(color, mode);
    ctx.beginPath();
    if (
      isOutlineMode(mode)
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
