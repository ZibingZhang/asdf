import {
  RString,
  RSymbol
} from "../../../rvalue";
import {
  StringLiteralType,
  SymbolLiteralType,
  Type
} from "../../../types";

export {
  ImageType,
  ModeType
};

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
    new StringLiteralType(new RString("outline"))
  ]

  isSuperTypeOfHelper(type: Type): boolean {
    return type instanceof ModeType
      || this.children.some(child => child.isSuperTypeOf(type));
  }

  stringify(): string {
    return "'solid \"solid\" 'outline or \"outline\"";
  }
}
