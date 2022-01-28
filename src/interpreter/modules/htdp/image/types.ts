import {
  Type
} from "../../../types";

export {
  ImageType
};

class ImageType extends Type {
  isSuperTypeOfHelper(type: Type): boolean {
    return type instanceof ImageType;
  }

  stringify(): string {
    return "image";
  }
}
