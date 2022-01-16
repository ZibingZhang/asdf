// import {
//   PRIMITIVE_DATA_NAMES,
//   PRIMITIVE_FUNCTIONS,
//   PRIMITIVE_STRUCT_NAMES
// } from "./environment";
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
import { Global } from "./global";

export {
  // DATA_VARIABLE_META,
  // PRIMITIVE_SCOPE,
  // STRUCTURE_TYPE_VARIABLE_META,
  Scope,
  VariableType,
  VariableMeta
};

class Scope {
  parentScope: Scope | false;
  private global = new Global();
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
            && this.global.primitiveRelaxedScope.variables.has(name)
            && this.global.primitiveRelaxedScope.get(name, expectData, sourceSpan)
          ) || (
            this.global.primitiveScope.variables.has(name)
            && this.global.primitiveScope.get(name, expectData, sourceSpan)
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
        && this.global.primitiveScope.variables.has(name)
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
