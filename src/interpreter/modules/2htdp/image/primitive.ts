/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  NonNegativeRealType,
  ProcedureType
} from "../../../types";
import {
  isRStruct,
  RNumber,
  RPrimProc,
  RString,
  RSymbol,
  RValue
} from "../../../rvalue";
import {
  ColorType,
  COLOR_NAMES,
  ImageType,
  ModeType
} from "./types";
import {
  RImage
} from "./rvalue";

export {
  RPPCircle,
  RPPRectangle
};

const OUTLINE_MODE = "outline";
const OUTLINE_WIDTH = 2;
const BACKGROUND_COLOR = "white";
const TAU = 2 * Math.PI;

function newCanvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const element = <HTMLCanvasElement> document.createElement("canvas");
  element.width = width;
  element.height = height;
  return [element, element.getContext("2d")!];
}

function toRgb(rval: RValue): string {
  if (isRStruct(rval)) {
    return `rgb(${rval.vals[0].stringify()}, ${rval.vals[1].stringify()}, ${rval.vals[2].stringify()})`;
  } else {
    return `rgb(${COLOR_NAMES.get((<RString>rval).val)!.join(", ")})`;
  }
}

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
    ctx.rect(0, 0, width, height);
    ctx.fill();
    if (
      mode === OUTLINE_MODE
      && width > OUTLINE_WIDTH
      && height > OUTLINE_WIDTH
    ) {
      ctx.fillStyle = BACKGROUND_COLOR;
      ctx.beginPath();
      ctx.rect(OUTLINE_WIDTH, OUTLINE_WIDTH, width - 2 * OUTLINE_WIDTH, height - 2 * OUTLINE_WIDTH);
      ctx.fill();
    }
    return new RImage(canvas);
  }
}
