export {
  SETTINGS,
  Settings,
  updateSettings
};

type Settings = {
  stringify: {
    abbreviatedList: boolean
  }
};

const DEFAULT_SETTINGS: Settings = {
  stringify: {
    abbreviatedList: false
  }
};

let SETTINGS: Settings = DEFAULT_SETTINGS;

function updateSettings(settings = {}) {
  SETTINGS = {...DEFAULT_SETTINGS, ...settings};
}
