import {
  PRIMITIVE_DATA_NAMES,
  PRIMITIVE_FUNCTIONS,
  PRIMITIVE_STRUCT_NAMES
} from "./environment";
import {
  SC_UNDEFINED_FUNCTION_ERR,
  SC_UNDEFINED_VARIABLE_ERR
} from "./error";
import {
  SETTINGS
} from "./settings";
import {
  SourceSpan
} from "./sourcespan";
import {
  StageError
} from "./pipeline";

export {
  DATA_VARIABLE_META,
  PRIMITIVE_SCOPE,
  STRUCTURE_TYPE_VARIABLE_META,
  Scope,
  VariableType,
  VariableMeta
};

class Scope {
  parentScope: Scope | false;
  private variables: Map<string, VariableMeta> = new Map();

  constructor(parentScope: Scope | false = false) {
    this.parentScope = parentScope;
  }

  set(name: string, meta: VariableMeta) {
    this.variables.set(name, meta);
  }

  get(name: string, expectData: boolean, sourceSpan: SourceSpan): VariableMeta {
    const meta = this.variables.get(name)
      || (this.parentScope && this.parentScope.get(name, expectData, sourceSpan))
      || (
        !SETTINGS.primitives.blackList.includes(name)
        && (
          (
            SETTINGS.primitives.relaxedConditions.includes(name)
            && PRIMITIVE_RELAXED_SCOPE.variables.has(name)
            && PRIMITIVE_RELAXED_SCOPE.get(name, expectData, sourceSpan)
          ) || (
            PRIMITIVE_SCOPE.variables.has(name)
            && PRIMITIVE_SCOPE.get(name, expectData, sourceSpan)
          )
        )
      );
    if (!meta) {
      if (expectData) {
        throw new StageError(
          SC_UNDEFINED_VARIABLE_ERR(name),
          sourceSpan
        );
      } else {
        throw new StageError(
          SC_UNDEFINED_FUNCTION_ERR(name),
          sourceSpan
        );
      }
    }
    return meta;
  }

  has(name: string): boolean {
    return this.variables.has(name)
      || (this.parentScope && this.parentScope.has(name))
      || (
        !SETTINGS.primitives.blackList.includes(name)
        && PRIMITIVE_SCOPE.variables.has(name)
      );
  }
}

enum VariableType {
  Data = "DATA",
  PrimitiveFunction = "PRIMITIVE_FUNCTION",
  StructureType = "STRUCTURE_TYPE",
  UserDefinedFunction = "USER_DEFINED_FUNCTION"
}

class VariableMeta {
  constructor(
    readonly type: VariableType,
    readonly arity: number = -1
  ) {}
}

const DATA_VARIABLE_META = new VariableMeta(VariableType.Data);
const STRUCTURE_TYPE_VARIABLE_META = new VariableMeta(VariableType.StructureType);

const PRIMITIVE_SCOPE = new Scope();
const PRIMITIVE_RELAXED_SCOPE = new Scope();
PRIMITIVE_DATA_NAMES.forEach((name) => PRIMITIVE_SCOPE.set(name, DATA_VARIABLE_META));
PRIMITIVE_FUNCTIONS.forEach((config, name) => {
  if (config.relaxedMinArity !== undefined) {
    PRIMITIVE_RELAXED_SCOPE.set(name, new VariableMeta(VariableType.PrimitiveFunction, config.relaxedMinArity));
  }
  PRIMITIVE_SCOPE.set(name, new VariableMeta(VariableType.PrimitiveFunction, config.arity || config.minArity || -1));
});
PRIMITIVE_STRUCT_NAMES.forEach((name) => PRIMITIVE_SCOPE.set(name, STRUCTURE_TYPE_VARIABLE_META));
