import {
  ImageType
} from "./types";
import {
  isRExactReal,
  RExactReal,
  RValue
} from "../../../rvalue";
import {
  Type
} from "../../../types";

export {
  RImage,
  isRExact8BitNumber,
  isRImage
};

class RImage implements RValue {
  constructor(
    readonly width: number,
    readonly height: number,
    readonly canvas: HTMLCanvasElement
  ) {}

  stringify(): string {
    throw "illegal state: cannot stringify an image";
  }

  getType(): Type {
    return new ImageType();
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
