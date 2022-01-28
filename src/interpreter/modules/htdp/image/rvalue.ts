import {
  ImageType
} from "./types";
import {
  RValue
} from "../../../rvalue";
import {
  Type
} from "../../../types";

export {
  RImage,
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

function isRImage(rval: RValue): rval is RImage {
  return rval instanceof RImage;
}
