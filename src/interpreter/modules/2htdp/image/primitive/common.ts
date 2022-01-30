import {
  RString,
  RValue,
  isRExactReal,
  isRStruct,
  RNumber
} from "../../../../rvalue";
import {
  COLOR_NAMES
} from "../types";
import {
  RMode
} from "../rvalue";

export {
  OUTLINE_WIDTH,
  HALF_OUTLINE_WIDTH,
  BACKGROUND_COLOR,
  TAU,
  newCanvas,
  toRgb,
  isOutlineMode
};

const OUTLINE_WIDTH = 2;
const HALF_OUTLINE_WIDTH = OUTLINE_WIDTH / 2;
const BACKGROUND_COLOR = "white";
const TAU = 2 * Math.PI;

function newCanvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const element = <HTMLCanvasElement> document.createElement("canvas");
  element.width = width;
  element.height = height;
  return [element, element.getContext("2d")!];
}

function toRgb(color: RValue, mode: RMode): string {
  let a = isRExactReal(mode) ? Number(mode.numerator) / 255 : 1;
  if (isRStruct(color)) {
    a *= Number((<RNumber>color.vals[3]).numerator) / 255;
    return `rgba(${color.vals[0].stringify()}, ${color.vals[1].stringify()}, ${color.vals[2].stringify()}, ${a})`;
  } else {
    /* eslint-disable @typescript-eslint/no-non-null-assertion */
    return `rgba(${COLOR_NAMES.get((<RString>color).val)!.join(", ")}, ${a})`;
  }
}

function isOutlineMode(mode: RMode) {
  return !isRExactReal(mode)
    && mode.val === "outline";
}
