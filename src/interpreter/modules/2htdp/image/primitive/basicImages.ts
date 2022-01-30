import {
  BACKGROUND_COLOR,
  HALF_OUTLINE_WIDTH,
  OUTLINE_WIDTH,
  TAU,
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
  RPC_EMPTY_IMAGE,
  RPPCircle,
  RPPEllipse
};

const RPC_EMPTY_IMAGE = new RImage(newCanvas(0, 0)[0]);

class RPPCircle extends RPrimProc {
  constructor() {
    super("circle");
  }

  getType(): ProcedureType {
    return new ProcedureType([new NonNegativeRealType(), new ModeType(), new ColorType()], new ImageType());
  }

  call(args: RValue[]): RValue {
    const radius = Number((<RNumber>args[0]).numerator);
    const mode = <RMode>args[1];
    const color = args[2];
    const [canvas, ctx] = newCanvas(2 * radius, 2 * radius);
    ctx.fillStyle = toRgb(color, mode);
    ctx.beginPath();
    if (
      isOutlineMode(mode)
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
    const mode = <RMode>args[2];
    const color = args[3];
    const [canvas, ctx] = newCanvas(width, height);
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    ctx.fillStyle = toRgb(color, mode);
    ctx.beginPath();

    if (
      isOutlineMode(mode)
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
