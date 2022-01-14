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
    forms: string[]
  }
};

function updateSettings(settings = {}) {
  SETTINGS = {...DEFAULT_SETTINGS, ...settings};
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
    forms: [...ALL_KEYWORDS]
  }
};

let SETTINGS: Settings = DEFAULT_SETTINGS;
