import {
  BACKGROUND_COLOR,
  HALF_OUTLINE_WIDTH,
  OUTLINE_MODE,
  OUTLINE_WIDTH,
  TAU,
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
  RNumber,
  RPrimProc,
  RSymbol,
  RValue
} from "../../../../rvalue";
import {
  RImage
} from "../rvalue";

export {
  RPPCircle,
  RPPEllipse
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
    if (
      mode === OUTLINE_MODE
      && radius > OUTLINE_WIDTH
    ) {
      ctx.arc(radius, radius, radius + HALF_OUTLINE_WIDTH, 0, TAU);
      ctx.fill();
      ctx.fillStyle = BACKGROUND_COLOR;
      ctx.beginPath();
      ctx.arc(radius, radius, radius - HALF_OUTLINE_WIDTH, 0, TAU);
      ctx.fill();
    } else {
      ctx.arc(radius, radius, radius, 0, TAU);
      ctx.fill();
    }
    return new RImage(canvas);
  }
}

class RPPEllipse extends RPrimProc {
  constructor() {
    super("ellipse");
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
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    ctx.fillStyle = toRgb(color);
    ctx.beginPath();

    if (
      mode === OUTLINE_MODE
      && width > OUTLINE_WIDTH
      && height > OUTLINE_WIDTH
    ) {
      ctx.ellipse(halfWidth, halfHeight, halfWidth + HALF_OUTLINE_WIDTH, halfHeight + HALF_OUTLINE_WIDTH, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = BACKGROUND_COLOR;
      ctx.beginPath();
      ctx.ellipse(halfWidth, halfHeight, halfWidth - HALF_OUTLINE_WIDTH, halfHeight - HALF_OUTLINE_WIDTH, 0, 0, TAU);
      ctx.fill();
    } else {
      ctx.ellipse(halfWidth, halfHeight, halfWidth, halfHeight, 0, 0, TAU);
      ctx.fill();
    }
    return new RImage(canvas);
  }
}
