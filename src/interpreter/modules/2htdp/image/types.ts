import {
  RString,
  RSymbol,
  RValue,
  isRExactReal,
  isRString,
  isRStruct,
  isRSymbol
} from "../../../rvalue";
import {
  HI_NOT_VALID_COLOR_ERR
} from "./error";
import {
  SourceSpan
} from "../../../sourcespan";
import {
  StageError
} from "../../../pipeline";
import {
  Type
} from "../../../types";
import {
  isValidColorName
} from "./primitive/common";
import {
  isRExact8BitInteger
} from "./rvalue";

export {
  ColorType,
  Exact8BitIntegerType,
  ImageType,
  ModeType,
  isColorType
};

class ColorType extends Type {
  stringify(): string {
    return "image-color";
  }

  isCompatibleWith(rval: RValue, name: string, sourceSpan: SourceSpan): boolean {
    if (isRString(rval) || isRSymbol(rval)) {
      if (isValidColorName(rval)) {
        return true;
      } else {
        throw new StageError(
          HI_NOT_VALID_COLOR_ERR(name, rval.stringify()),
          sourceSpan
        );
      }
    } else if (isRStruct(rval)) {
      // should actually check for exact struct type defined by module
      if (
        rval.name === "color"
        && rval.vals.length === 4
        && isRExact8BitInteger(rval.vals[0])
        && isRExact8BitInteger(rval.vals[1])
        && isRExact8BitInteger(rval.vals[2])
        && isRExact8BitInteger(rval.vals[2])
      ) {
        return true;
      }
    }
    return false;
  }

  isSuperTypeOfHelper(type: Type): boolean {
    return type instanceof ColorType;
  }
}

class Exact8BitIntegerType extends Type {
  stringify(): string {
    return "integer between 0 and 255";
  }

  isSuperTypeOfHelper(type: Type, rval: RValue): boolean {
    return type instanceof Exact8BitIntegerType
      || (
        isRExactReal(rval)
        && rval.denominator === 1n
        && rval.numerator >= 0
        && rval.numerator < 256
      );
  }
}

class ImageType extends Type {
  isSuperTypeOfHelper(type: Type): boolean {
    return type instanceof ImageType;
  }

  stringify(): string {
    return "image";
  }
}

class ModeType extends Type {
  constructor() {
    super(
      [new Exact8BitIntegerType()],
      [
        new RString("solid"),
        new RSymbol("solid"),
        new RString("outline"),
        new RSymbol("outline")
      ]
    );
  }

  stringify(): string {
    return "mode";
  }
}

function isColorType(type: Type): type is ColorType {
  return type instanceof ColorType;
}
