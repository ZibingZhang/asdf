/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  RString,
  RValue,
  isRExactReal,
  isRStruct
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

function toRgb(rval: RValue, mode: RMode): string {

  const a = isRExactReal(mode) ? Number(mode.numerator) / 255 : 1;
  if (isRStruct(rval)) {
    return `rgba(${rval.vals[0].stringify()}, ${rval.vals[1].stringify()}, ${rval.vals[2].stringify()}, ${a})`;
  } else {
    return `rgba(${COLOR_NAMES.get((<RString>rval).val)!.join(", ")}, ${a})`;
  }
}

function isOutlineMode(mode: RMode) {
  return !isRExactReal(mode)
    && mode.val === "outline";
}
