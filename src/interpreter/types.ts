import {
  RBoolean,
  RData,
  RNumber,
  RString,
  RSymbol,
  RValue
} from "./rvalue";

export{
  AnyProcedureType,
  AnyType,
  BooleanType,
  BooleanLiteralType,
  CharacterType,
  EofObjectType,
  ErrorType,
  ExactNonNegativeIntegerType,
  ExactPositiveIntegerType,
  IntegerType,
  ListType,
  NonNegativeRealType,
  NumberType,
  NumberLiteralType,
  OrType,
  PairType,
  ProcedureType,
  RationalType,
  RealType,
  StringType,
  StringLiteralType,
  StructType,
  StructTypeType,
  SymbolType,
  SymbolLiteralType,
  Type,
  VoidType,
  isAnyProcedureType,
  isAnyType,
  isProcedureType
};

abstract class Type {
  isSuperTypeOf(type: Type, rval: RValue): boolean {
    if (this instanceof LiteralType) {
      if (this.literal) {
        return this.literal.getType().isSuperTypeOf(type, rval)
          && this.literal.equal(rval);
      } else {
        return false;
      }
    } else {
      return this.isSuperTypeOfHelper(type, rval);
    }
  }

  abstract isSuperTypeOfHelper(type: Type, rval: RValue): boolean;

  abstract stringify(): string;
}

abstract class LiteralType extends Type {
  constructor(readonly literal: RData) {
    super();
  }

  isSuperTypeOfHelper(type: Type): boolean {
    return type instanceof LiteralType
      && type.literal.equal(this.literal);
  }

  stringify(): string {
    return this.literal.stringify();
  }
}

class AnyProcedureType extends Type {
  isSuperTypeOfHelper(type: Type): boolean {
    return type instanceof AnyProcedureType
      || type instanceof ProcedureType;
  }

  stringify(): string {
    return "procedure";
  }
}

class AnyType extends Type {
  isSuperTypeOfHelper(_: Type): boolean {
    return true;
  }

  stringify(): string {
    return "any/c";
  }
}

class BooleanType extends Type {
  isSuperTypeOfHelper(type: Type): boolean {
    return type instanceof BooleanType;
  }

  stringify(): string {
    return "boolean";
  }
}

class BooleanLiteralType extends LiteralType {
  constructor(readonly literal: RBoolean) {
    super(literal);
  }
}

class CharacterType extends Type {
  isSuperTypeOfHelper(type: Type): boolean {
    return type instanceof CharacterType;
  }

  stringify(): string {
    return "character";
  }
}

class EofObjectType extends Type {
  isSuperTypeOfHelper(type: Type): boolean {
    return type instanceof VoidType;
  }

  stringify(): string {
    return "eof-object";
  }
}

class ErrorType extends Type {
  isSuperTypeOfHelper(type: Type): boolean {
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

  isSuperTypeOfHelper(type: Type, rval: RValue): boolean {
    return type instanceof ExactNonNegativeIntegerType
      || this.children.some(child => child.isSuperTypeOf(type, rval));
  }

  stringify(): string {
    return "exact-non-negative-integer";
  }
}

class ExactPositiveIntegerType extends Type {
  isSuperTypeOfHelper(type: Type): boolean {
    return type instanceof ExactPositiveIntegerType;
  }

  stringify(): string {
    return "exact-positive-integer";
  }
}

class IntegerType extends Type {
  children: Type[] = [
    new ExactNonNegativeIntegerType()
  ];

  isSuperTypeOfHelper(type: Type, rval: RValue): boolean {
    return type instanceof IntegerType
      || this.children.some(child => child.isSuperTypeOf(type, rval));
  }

  stringify(): string {
    return "integer";
  }
}

class ListType extends Type {
  constructor(readonly minLength: number = 0) {
    super();
  }

  isSuperTypeOfHelper(type: Type): boolean {
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

  isSuperTypeOfHelper(type: Type, rval: RValue): boolean {
    return type instanceof NonNegativeRealType
      || this.children.some(child => child.isSuperTypeOf(type, rval));
  }

  stringify(): string {
    return "non-negative-real";
  }
}

class NumberType extends Type {
  children: Type[] = [
    new RealType()
  ];

  isSuperTypeOfHelper(type: Type, rval: RValue): boolean {
    return type instanceof NumberType
      || this.children.some(child => child.isSuperTypeOf(type, rval));
  }

  stringify(): string {
    return "number";
  }
}

class NumberLiteralType extends LiteralType {
  constructor(literal: RNumber) {
    super(literal);
  }
}

class OrType extends Type {
  readonly subTypes: Type[];

  constructor(...subTypes: Type[]) {
    super();
    this.subTypes = subTypes;
  }

  isSuperTypeOfHelper(type: Type, rval: RValue): boolean {
    return this.subTypes.some(subType => subType.isSuperTypeOfHelper(type, rval));
  }

  stringify(): string {
    return `(or/c ${this.subTypes.map(subType => subType.stringify()).join(" ")})`;
  }
}

class PairType extends Type {
  isSuperTypeOfHelper(type: Type): boolean {
    return type instanceof PairType
      || type instanceof ListType;
  }

  stringify(): string {
    return "pair";
  }
}

class ProcedureType extends Type {
  constructor(
    readonly paramTypes: Type[],
    readonly outputType: Type
  ) {
    super();
  }

  isSuperTypeOfHelper(type: Type, rval: RValue): boolean {
    return type instanceof ProcedureType
      && type.paramTypes.length === this.paramTypes.length
      && this.paramTypes.every((paramType, idx) => paramType.isSuperTypeOf(type.paramTypes[idx], rval))
      && this.outputType.isSuperTypeOf(type.outputType, rval);
  }

  isCompatibleWith(type: Type, rval: RValue): boolean {
    return type instanceof ProcedureType
      && type.paramTypes.length === this.paramTypes.length
      && this.paramTypes.every((paramType, idx) =>
        paramType.isSuperTypeOf(type.paramTypes[idx], rval)
          || type.paramTypes[idx].isSuperTypeOf(paramType, rval)
      )
      && (
        this.outputType.isSuperTypeOf(type.outputType, rval)
        || type.outputType.isSuperTypeOf(this.outputType, rval)
      );
  }

  stringify(): string {
    return `(${this.paramTypes.map(paramType => paramType.stringify()).join(" ")} . -> . ${this.outputType.stringify()})`;
  }
}

class RationalType extends Type {
  children: Type[] = [
    new IntegerType()
  ];

  isSuperTypeOfHelper(type: Type, rval: RValue): boolean {
    return type instanceof RationalType
      || this.children.some(child => child.isSuperTypeOf(type, rval));
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

  isSuperTypeOfHelper(type: Type, rval: RValue): boolean {
    return type instanceof RealType
      || this.children.some(child => child.isSuperTypeOf(type, rval));
  }

  stringify(): string {
    return "real";
  }
}

class StringType extends Type {
  isSuperTypeOfHelper(type: Type, rval: RValue): boolean {
    return type instanceof StringType;
  }

  stringify(): string {
    return "string";
  }
}

class StringLiteralType extends LiteralType {
  constructor(literal: RString) {
    super(literal);
  }
}

class StructType extends Type {
  constructor(readonly name: string) {
    super();
  }

  isSuperTypeOfHelper(type: Type): boolean {
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

  isSuperTypeOfHelper(type: Type): boolean {
    return type instanceof StructTypeType
      && type.name === this.name;
  }

  stringify(): string {
    return this.name;
  }
}

class SymbolType extends Type {
  isSuperTypeOfHelper(type: Type): boolean {
    return type instanceof SymbolType;
  }

  stringify(): string {
    return "string";
  }
}

class SymbolLiteralType extends LiteralType {
  constructor(literal: RSymbol) {
    super(literal);
  }
}

class VoidType extends Type {
  isSuperTypeOfHelper(type: Type): boolean {
    return type instanceof VoidType;
  }

  stringify(): string {
    return "void";
  }
}

function isAnyProcedureType(type: Type): type is AnyProcedureType {
  return type instanceof AnyProcedureType;
}

function isAnyType(type: Type): type is AnyType {
  return type instanceof AnyType;
}

function isProcedureType(type: Type): type is ProcedureType {
  return type instanceof ProcedureType;
}
