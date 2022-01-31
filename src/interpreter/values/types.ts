import {
  RValue,
  isRProcedure
} from "./rvalue";
import {
  SourceSpan
} from "../data/sourcespan";

export{
  AnyProcedureType,
  AnyType,
  BooleanType,
  CharacterType,
  EofObjectType,
  ErrorType,
  ExactNonNegativeIntegerType,
  ExactPositiveIntegerType,
  IntegerType,
  ListType,
  NonNegativeRealType,
  NumberType,
  OrType,
  PairType,
  ProcedureType,
  RationalType,
  RealType,
  StringType,
  StructType,
  StructTypeType,
  SymbolType,
  Type,
  VoidType,
  isAnyProcedureType,
  isAnyType,
  isProcedureType
};

abstract class Type {
  constructor(
    readonly children: Type[] = [],
    readonly literals: RValue[] = []
  ) {}

  abstract stringify(): string;

  isCompatibleWith(rval: RValue, _name: string, _sourceSpan: SourceSpan): boolean {
    return this.isSuperTypeOf(rval.getType(-1), rval);
  }

  isSuperTypeOf(type: Type, rval: RValue): boolean {
    return type instanceof this.constructor
      || this.children.some(child => child.isSuperTypeOf(type, rval))
      || this.literals.some(literal => literal.equal(rval));
  }
}

class AnyType extends Type {
  stringify(): string {
    return "any/c";
  }

  isCompatibleWith(): boolean {
    return true;
  }

  isSuperTypeOf(): boolean {
    return true;
  }
}

class AnyProcedureType extends Type {
  stringify(): string {
    return "procedure";
  }

  isCompatibleWith(rval: RValue): boolean {
    return isRProcedure(rval);
  }

  isSuperTypeOf(type: Type): boolean {
    return type instanceof AnyProcedureType
      || type instanceof ProcedureType;
  }
}

class BooleanType extends Type {
  stringify(): string {
    return "boolean";
  }
}

class CharacterType extends Type {
  stringify(): string {
    return "character";
  }
}

class EofObjectType extends Type {
  constructor() {
    super(
      [new VoidType()]
    );
  }

  stringify(): string {
    return "eof-object";
  }
}

class ErrorType extends Type {
  stringify(): string {
    return "error";
  }
}

class ExactNonNegativeIntegerType extends Type {
  constructor() {
    super(
      [new ExactPositiveIntegerType()]
    );
  }

  stringify(): string {
    return "exact-non-negative-integer";
  }
}

class ExactPositiveIntegerType extends Type {
  stringify(): string {
    return "exact-positive-integer";
  }
}

class IntegerType extends Type {
  constructor() {
    super(
      [new ExactNonNegativeIntegerType()]
    );
  }

  stringify(): string {
    return "integer";
  }
}

class ListType extends Type {
  constructor(readonly minLength: number = 0) {
    super();
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

  isSuperTypeOf(type: Type): boolean {
    return (
      type instanceof ListType
      && type.minLength >= this.minLength
    ) || (
      this.minLength === 0
      && type instanceof PairType
    );
  }
}

class NonNegativeRealType extends Type {
  constructor() {
    super(
      [new ExactNonNegativeIntegerType()]
    );
  }

  stringify(): string {
    return "non-negative-real";
  }
}

class NumberType extends Type {
  constructor() {
    super(
      [new RealType()]
    );
  }

  stringify(): string {
    return "number";
  }
}

class OrType extends Type {
  constructor(
    types: Type[],
    literals: RValue[]
  ) {
    super(
      types,
      literals
    );
  }

  stringify(): string {
    return `(or/c ${this.children.map(subType => subType.stringify()).join(" ")})`;
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

class ProcedureType extends Type {
  constructor(
    readonly paramTypes: Type[],
    readonly outputType: Type
  ) {
    super();
  }

  isSuperTypeOf(type: Type, rval: RValue): boolean {
    return type instanceof ProcedureType
      && type.paramTypes.length === this.paramTypes.length
      && this.paramTypes.every((paramType, idx) => paramType.isSuperTypeOf(type.paramTypes[idx], rval))
      && this.outputType.isSuperTypeOf(type.outputType, rval);
  }

  isCompatibleWith(rval: RValue): boolean {
    if (!isRProcedure(rval)) {
      return false;
    }
    const type = rval.getType(this.paramTypes.length);
    return type.paramTypes.length === this.paramTypes.length
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
  constructor() {
    super(
      [new IntegerType()]
    );
  }

  stringify(): string {
    return "rational";
  }
}

class RealType extends Type {
  constructor() {
    super(
      [
        new NonNegativeRealType(),
        new RationalType()
      ]
    );
  }

  stringify(): string {
    return "real";
  }
}

class StringType extends Type {
  stringify(): string {
    return "string";
  }
}

class StructType extends Type {
  constructor(readonly name: string) {
    super();
  }

  stringify(): string {
    return "illegal state: should not have to stringify a structure type";
  }

  isSuperTypeOf(type: Type): boolean {
    return type instanceof StructType
      && type.name === this.name;
  }
}

class StructTypeType extends Type {
  constructor(readonly name: string) {
    super();
  }

  stringify(): string {
    return this.name;
  }

  isSuperTypeOf(type: Type): boolean {
    return type instanceof StructTypeType
      && type.name === this.name;
  }
}

class SymbolType extends Type {
  stringify(): string {
    return "string";
  }
}

class VoidType extends Type {
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
