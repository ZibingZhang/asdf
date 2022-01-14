import {
  ALL_KEYWORDS
} from "./keyword";

export {
  SETTINGS,
  Settings,
  updateSettings
};

type Settings = {
  stringify: {
    abbreviatedList: boolean
  }
  syntax: {
    forms: string[]
  }
};

const DEFAULT_SETTINGS = {
  stringify: {
    abbreviatedList: false
  },
  syntax: {
    forms: [...ALL_KEYWORDS]
  }
};

let SETTINGS: Settings = DEFAULT_SETTINGS;

function updateSettings(settings = {}) {
  SETTINGS = {...DEFAULT_SETTINGS, ...settings};
  SETTINGS.syntax.forms = SETTINGS.syntax.forms.filter(keyword => ALL_KEYWORDS.includes(keyword));
}
