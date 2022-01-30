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
  StringLiteralType,
  SymbolLiteralType,
  Type
} from "../../../types";
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
  isValidColorName
} from "./primitive/common";
import {
  isRExact8BitNumber
} from "./rvalue";

export {
  ColorType,
  Exact8BitNumberType,
  ImageType,
  ModeType,
  isColorType
};

class ColorType extends Type {
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
        && isRExact8BitNumber(rval.vals[0])
        && isRExact8BitNumber(rval.vals[1])
        && isRExact8BitNumber(rval.vals[2])
        && isRExact8BitNumber(rval.vals[2])
      ) {
        return true;
      }
    }
    return false;
  }

  isSuperTypeOfHelper(type: Type): boolean {
    return type instanceof ColorType;
  }

  stringify(): string {
    return "image-color";
  }
}

class Exact8BitNumberType extends Type {
  isSuperTypeOfHelper(type: Type, rval: RValue): boolean {
    return type instanceof Exact8BitNumberType
      || (
        isRExactReal(rval)
        && rval.denominator === 1n
        && rval.numerator >= 0
        && rval.numerator < 256
      );
  }

  stringify(): string {
    return "integer between 0 and 255";
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
  children: Type[] = [
    new SymbolLiteralType(new RSymbol("solid")),
    new StringLiteralType(new RString("solid")),
    new SymbolLiteralType(new RSymbol("outline")),
    new StringLiteralType(new RString("outline")),
    new Exact8BitNumberType()
  ];

  isSuperTypeOfHelper(type: Type, rval: RValue): boolean {
    return type instanceof ModeType
      || this.children.some(child => child.isSuperTypeOf(type, rval));
  }

  stringify(): string {
    return "mode";
  }
}

function isColorType(type: Type): type is ColorType {
  return type instanceof ColorType;
}
