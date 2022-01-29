/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  RData,
  RExactReal,
  RValue,
  isRExactReal
} from "../../../rvalue";
import {
  ImageType
} from "./types";
import {
  Type
} from "../../../types";

export {
  RImage,
  isRExact8BitNumber,
  isRImage
};

class RImage extends RData {
  constructor(
    readonly canvas: HTMLCanvasElement
  ) {
    super();
  }

  stringify(): string {
    throw "illegal state: cannot stringify an image";
  }

  getType(): Type {
    return new ImageType();
  }

  equalWithin(rval: RValue): boolean {
    if (
      !isRImage(rval)
      || rval.canvas.width !== this.canvas.width
      || rval.canvas.height !== this.canvas.height
    ) {
      return false;
    }
    const imgData1 = this.canvas.getContext("2d")!.getImageData(0, 0, this.canvas.width, this.canvas.height).data;
    const imgData2 = rval.canvas.getContext("2d")!.getImageData(0, 0, rval.canvas.width, rval.canvas.height).data;
    return imgData1.every((rgba, idx) => rgba === imgData2[idx]);
  }
}

function isRExact8BitNumber(rval: RValue): rval is RExactReal {
  return isRExactReal(rval)
    && rval.denominator === 1n
    && rval.numerator >= 0n
    && rval.numerator < 256n;
}

function isRImage(rval: RValue): rval is RImage {
  return rval instanceof RImage;
}
