import {
  SC_UNDEFINED_FUNCTION_ERR,
  SC_UNDEFINED_VARIABLE_ERR
} from "./error";
import {
  Global
} from "./global";
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
  Scope,
  VariableType
};

class Scope {
  parentScope: Scope | false;
  private global = new Global();
  private variables: Map<string, VariableType> = new Map();

  constructor(parentScope: Scope | false = false) {
    this.parentScope = parentScope;
  }

  set(name: string, type: VariableType) {
    this.variables.set(name, type);
  }

  get(name: string, expectData: boolean, sourceSpan: SourceSpan): VariableType {
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
