import {
  ALL_KEYWORDS
} from "./keyword";

export {
  SETTINGS,
  Settings,
  updateSettings
};

type Settings = {
  primitives: {
    blackList: string[]
  },
  stringify: {
    abbreviatedList: boolean
  }
  syntax: {
    forms: string[],
    listAbbreviation: boolean
  }
};

function updateSettings(settings = {}) {
  mergeDeep(SETTINGS, settings);
  SETTINGS.syntax.forms = SETTINGS.syntax.forms.filter(keyword => ALL_KEYWORDS.includes(keyword));
}

const DEFAULT_SETTINGS = {
  primitives: {
    blackList: []
  },
  stringify: {
    abbreviatedList: false
  },
  syntax: {
    forms: [...ALL_KEYWORDS],
    listAbbreviation: false
  }
};

let SETTINGS: Settings = DEFAULT_SETTINGS;

/* eslint-disable @typescript-eslint/no-explicit-any */
// https://stackoverflow.com/a/34749873
function mergeDeep(target: any, ...sources: any): void {
  if (!sources.length) return target;
  const source = sources.shift();
  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }
  mergeDeep(target, ...sources);
}

function isObject(item: object) {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

