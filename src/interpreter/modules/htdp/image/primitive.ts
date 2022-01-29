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
  ImageType, ModeType
} from "./types";
import {
  RImage
} from "./rvalue";

export {
  RPFRectangle
};

const OUTLINE_WIDTH = 2;

function newCanvas(width: number, height: number): HTMLCanvasElement {
  const element = <HTMLCanvasElement> document.createElement("canvas");
  element.width = width;
  element.height = height;
  return element;
}

class RPFRectangle extends RPrimProc {
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
    const canvas = newCanvas(width, height);
    const ctx = canvas.getContext("2d")!;
    if (isRStruct(color)) {
      ctx.fillStyle = `rgb(${color.vals[0].stringify()}, ${color.vals[1].stringify()}, ${color.vals[2].stringify()})`;
    } else {
      ctx.fillStyle = `rgb(${COLOR_NAMES.get((<RString>color).val)!.join(", ")})`;
    }
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
      width, height, canvas
    );
  }
}
