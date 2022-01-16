export{
  AnyType,
  BooleanType,
  CharacterType,
  ErrorType,
  ExactNonNegativeIntegerType,
  ExactPositiveIntegerType,
  FunctionType,
  IntegerType,
  ListType,
  NonNegativeRealType,
  NumberType,
  PairType,
  RationalType,
  RealType,
  StringType,
  StructType,
  StructTypeType,
  SymbolType,
  Type,
  VoidType,
  isFunctionType
};

abstract class Type {
  abstract isSuperTypeOf(type: Type): boolean;
  abstract stringify(): string;
}

class AnyType extends Type {
  isSuperTypeOf(_: Type): boolean {
    return true;
  }

  stringify(): string {
    return "any/c";
  }
}

class BooleanType extends Type {
  isSuperTypeOf(type: Type): boolean {
    return type instanceof BooleanType;
  }

  stringify(): string {
    return "boolean";
  }
}

class CharacterType extends Type {
  isSuperTypeOf(type: Type): boolean {
    return type instanceof CharacterType;
  }

  stringify(): string {
    return "character";
  }
}

class ErrorType extends Type {
  isSuperTypeOf(type: Type): boolean {
    return type instanceof ErrorType;
  }

  stringify(): string {
    return "error";
  }
}

class ExactNonNegativeIntegerType extends Type {
  children: Type[] = [
    new ExactPositiveIntegerType()
  ];

  isSuperTypeOf(type: Type): boolean {
    return type instanceof ExactNonNegativeIntegerType
      || this.children.some(child => child.isSuperTypeOf(type));
  }

  stringify(): string {
    return "exact-non-negative-integer";
  }
}

class ExactPositiveIntegerType extends Type {
  isSuperTypeOf(type: Type): boolean {
    return type instanceof ExactPositiveIntegerType;
  }

  stringify(): string {
    return "exact-positive-integer";
  }
}

class FunctionType extends Type {
  constructor(
    readonly paramTypes: Type[],
    readonly outputType: Type
  ) {
    super();
  }

  isSuperTypeOf(type: Type): boolean {
    return type instanceof FunctionType
      && type.paramTypes.length === this.paramTypes.length
      && this.paramTypes.every((paramType, idx) => paramType.isSuperTypeOf(type.paramTypes[idx]));
  }

  stringify(): string {
    return `(${this.paramTypes.map(paramType => paramType.stringify()).join(" ")} . -> . ${this.outputType.stringify()}}`;
  }
}

class IntegerType extends Type {
  children: Type[] = [
    new ExactNonNegativeIntegerType()
  ];

  isSuperTypeOf(type: Type): boolean {
    return type instanceof IntegerType
      || this.children.some(child => child.isSuperTypeOf(type));
  }

  stringify(): string {
    return "integer";
  }
}

class ListType extends Type {
  constructor(readonly minLength: number = 0) {
    super();
  }

  isSuperTypeOf(type: Type): boolean {
    return (
      type instanceof ListType
      && type.minLength >= this.minLength
    ) || (
      this.minLength === 0
      && type instanceof PairType
    );
  }

  stringify(): string {
    if (this.minLength === 0) {
      return "list";
    } else if (this.minLength === 1) {
      return "non-empty list";
    } else {
      return `list with ${this.minLength} or more elements`;
    }
  }
}

class NonNegativeRealType extends Type {
  children: Type[] = [
    new ExactNonNegativeIntegerType()
  ];

  isSuperTypeOf(type: Type): boolean {
    return type instanceof NonNegativeRealType
      || this.children.some(child => child.isSuperTypeOf(type));
  }

  stringify(): string {
    return "non-negative-real";
  }
}

class NumberType extends Type {
  children: Type[] = [
    new RealType()
  ];

  isSuperTypeOf(type: Type): boolean {
    return type instanceof NumberType
      || this.children.some(child => child.isSuperTypeOf(type));
  }

  stringify(): string {
    return "number";
  }
}

class PairType extends Type {
  isSuperTypeOf(type: Type): boolean {
    return type instanceof PairType
      || type instanceof ListType;
  }

  stringify(): string {
    return "pair";
  }
}

class RationalType extends Type {
  children: Type[] = [
    new IntegerType()
  ];

  isSuperTypeOf(type: Type): boolean {
    return type instanceof RationalType
      || this.children.some(child => child.isSuperTypeOf(type));
  }

  stringify(): string {
    return "rational";
  }
}

class RealType extends Type {
  children: Type[] = [
    new NonNegativeRealType(),
    new RationalType()
  ];

  isSuperTypeOf(type: Type): boolean {
    return type instanceof RealType
      || this.children.some(child => child.isSuperTypeOf(type));
  }

  stringify(): string {
    return "real";
  }
}

class StringType extends Type {
  isSuperTypeOf(type: Type): boolean {
    return type instanceof StringType;
  }

  stringify(): string {
    return "string";
  }
}

class StructType extends Type {
  constructor(readonly name: string) {
    super();
  }

  isSuperTypeOf(type: Type): boolean {
    return type instanceof StructType
      && type.name === this.name;
  }

  stringify(): string {
    return this.name;
  }
}

class StructTypeType extends Type {
  constructor(readonly name: string) {
    super();
  }

  isSuperTypeOf(type: Type): boolean {
    return type instanceof StructTypeType
      && type.name === this.name;
  }

  stringify(): string {
    return this.name;
  }
}

class SymbolType extends Type {
  isSuperTypeOf(type: Type): boolean {
    return type instanceof SymbolType;
  }

  stringify(): string {
    return "string";
  }
}

class VoidType extends Type {
  isSuperTypeOf(type: Type): boolean {
    return type instanceof VoidType;
  }

  stringify(): string {
    return "void";
  }
}

function isFunctionType(type: Type): type is FunctionType {
  return type instanceof FunctionType;
}
