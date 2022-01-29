import {
  RIsStructFun,
  RMakeStructFun,
  RModule,
  RStructGetFun,
  RStructType,
  RValue
} from "./rvalue";
import {
  Global
} from "./global";
import {
  SC_USED_BEFORE_DEFINITION_ERR
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
  Environment
};

class Environment {
  parentEnv: Environment | undefined;
  private global = new Global();
  private map: Map<string, RValue> = new Map();

  constructor(parentEnv?: Environment) {
    this.parentEnv = parentEnv;
  }

  set(name: string, value: RValue) {
    this.map.set(name, value);
  }

  get(name: string, sourceSpan: SourceSpan): RValue {
    const val = this.map.get(name);
    if (val) {
      return val;
    } else if (!this.parentEnv) {
      if (
        !SETTINGS.primitives.blackList.includes(name)
        && this.global.primitiveEnvironment.map.has(name)
      ) {
        return this.global.primitiveEnvironment.get(name, sourceSpan);
      } else {
        throw new StageError(
          SC_USED_BEFORE_DEFINITION_ERR(name),
          sourceSpan
        );
      }
    } else {
      return this.parentEnv.get(name, sourceSpan);
    }
  }

  delete(name: string) {
    this.map.delete(name);
  }

  copy(): Environment {
    const env = new Environment();
    for (const entry of this.map.entries()) {
      env.set(entry[0], entry[1]);
    }
    /* eslint-disable @typescript-eslint/no-this-alias */
    let ancestorEnv: Environment | null = this;
    while (ancestorEnv.parentEnv) {
      ancestorEnv = ancestorEnv.parentEnv;
      for (const [key, value] of ancestorEnv.map.entries()) {
        if (!env.map.has(key)) {
          env.set(key, value);
        }
      }
    }
    return env;
  }

  has(name: string): boolean {
    return this.map.has(name)
      || (this.parentEnv && this.parentEnv.has(name))
      || (
        !SETTINGS.primitives.blackList.includes(name)
        && this.global.primitiveEnvironment.map.has(name)
      );
  }

  addModule(module: RModule) {
    for (const [name, fields] of module.structures) {
      if (!this.has(name)) {
        this.set(name, new RStructType(name));
      }
      for (const [idx, field] of fields.entries()) {
        if (!this.has(`${name}-${field}`)) {
          this.set(`${name}-${field}`, new RStructGetFun(name, field, idx));
        }
      }
      if (!this.has(`make-${name}`)) {
        this.set(`make-${name}`, new RMakeStructFun(name, fields.length));
      }
      if (!this.has(`${name}?`)) {
        this.set(`${name}?`, new RIsStructFun(name));
      }
    }
    for (const procedure of module.procedures) {
      if (!this.has(procedure.name)) {
        this.map.set(procedure.name, procedure);
      }
    }
  }
}
