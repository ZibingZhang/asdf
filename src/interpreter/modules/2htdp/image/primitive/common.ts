/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  isRStruct,
  RString,
  RValue
} from "../../../../rvalue";
import {
  COLOR_NAMES
} from "../types";

export {
  OUTLINE_MODE,
  OUTLINE_WIDTH,
  HALF_OUTLINE_WIDTH,
  BACKGROUND_COLOR,
  TAU,
  newCanvas,
  toRgb
};

const OUTLINE_MODE = "outline";
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

function toRgb(rval: RValue): string {
  if (isRStruct(rval)) {
    return `rgb(${rval.vals[0].stringify()}, ${rval.vals[1].stringify()}, ${rval.vals[2].stringify()})`;
  } else {
    return `rgb(${COLOR_NAMES.get((<RString>rval).val)!.join(", ")})`;
  }
}
