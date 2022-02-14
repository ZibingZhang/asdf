import {
  ALL_KEYWORDS
} from "./data/keyword";
import {
  Global
} from "./global";

export {
  SETTINGS,
  Settings,
  updateSettings
};

type Settings = {
  higherOrderFunctions: boolean,
  primitives: {
    blackList: string[],
    relaxedConditions: string[]
  },
  stringify: {
    abbreviatedList: boolean
  }
  syntax: {
    forms: string[],
    lambdaExpression: boolean,
    listAbbreviation: boolean,
    quasiquoting: boolean
  }
};

function updateSettings(settings = {}) {
  mergeDeep(SETTINGS, settings);
  SETTINGS.syntax.forms = SETTINGS.syntax.forms.filter(keyword => ALL_KEYWORDS.includes(keyword));
  if (SETTINGS.higherOrderFunctions) {
    new Global().enableHigherOrderFunctions();
  } else {
    new Global().disableHigherOrderFunctions();
  }
}

const DEFAULT_SETTINGS = {
  higherOrderFunctions: false,
  primitives: {
    blackList: [],
    relaxedConditions: []
  },
  stringify: {
    abbreviatedList: false
  },
  syntax: {
    forms: [...ALL_KEYWORDS],
    lambdaExpression: false,
    listAbbreviation: false,
    quasiquoting: false
  }
};

const SETTINGS: Settings = DEFAULT_SETTINGS;

/* eslint-disable @typescript-eslint/no-explicit-any */
// https://stackoverflow.com/a/34749873
function mergeDeep(target: any, ...sources: any): void {
  if (!sources.length) {return target;}
  const source = sources.shift();
  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) {Object.assign(target, { [key]: {} });}
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }
  mergeDeep(target, ...sources);
}

function isObject(item: object) {
  return (item && typeof item === "object" && !Array.isArray(item));
}

