import {
  NonNegativeRealType,
  ProcedureType
} from "../../../../types";
import {
  RMath,
  RPrimProc,
  RValue
} from "../../../../rvalue";
import {
  ImageType
} from "../types";
import {
  RImage
} from "../rvalue";

export {
  RPPImageWidth,
  RPPImageHeight
};

class RPPImageWidth extends RPrimProc {
  constructor() {
    super("image-width");
  }

  getType(): ProcedureType {
    return new ProcedureType([new ImageType()], new NonNegativeRealType());
  }

  call(args: RValue[]): RValue {
    const image = <RImage>args[0];
    return RMath.make(true, BigInt(image.canvas.width));
  }
}

class RPPImageHeight extends RPrimProc {
  constructor() {
    super("image-height");
  }

  getType(): ProcedureType {
    return new ProcedureType([new ImageType()], new NonNegativeRealType());
  }

  call(args: RValue[]): RValue {
    const image = <RImage>args[0];
    return RMath.make(true, BigInt(image.canvas.height));
  }
}
