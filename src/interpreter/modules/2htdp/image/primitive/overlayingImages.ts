import {
  RImage,
  isREmptyImage
} from "../rvalue";
import {
  RPrimProc,
  RValue
} from "../../../../values/rvalue";
import {
  ImageType
} from "../types";
import {
  ProcedureType
} from "../../../../values/types";
import {
  newCanvas
} from "./common";

export {
  RPPBeside,
  RPPAbove
};

class RPPBeside extends RPrimProc {
  constructor() {
    super("beside", { minArity: 2 });
  }

  getType(args: number): ProcedureType {
    return new ProcedureType(new Array(args).fill(new ImageType()), new ImageType());
  }

  call(args: RValue[]): RValue {
    let width = 0;
    let height = 0;
    for (const image of <RImage[]>args) {
      width += image.canvas.width;
      height = Math.max(height, image.canvas.height);
    }
    const [canvas, ctx] = newCanvas(width, height);
    let offset = 0;
    for (const image of <RImage[]>args) {
      if (isREmptyImage(image)) { continue; }
      ctx.drawImage(image.canvas, offset, (height - image.canvas.height) / 2);
      offset += image.canvas.width;
    }
    return new RImage(canvas);
  }
}

class RPPAbove extends RPrimProc {
  constructor() {
    super("above", { minArity: 2 });
  }

  getType(args: number): ProcedureType {
    return new ProcedureType(new Array(args).fill(new ImageType()), new ImageType());
  }

  call(args: RValue[]): RValue {
    let width = 0;
    let height = 0;
    for (const image of <RImage[]>args) {
      width = Math.max(width, image.canvas.width);
      height += image.canvas.height;
    }
    const [canvas, ctx] = newCanvas(width, height);
    let offset = 0;
    for (const image of <RImage[]>args) {
      if (isREmptyImage(image)) { continue; }
      ctx.drawImage(image.canvas, (width - image.canvas.width) / 2, offset);
      offset += image.canvas.height;
    }
    return new RImage(canvas);
  }
}

