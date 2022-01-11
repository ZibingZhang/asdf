export {
  SETTINGS,
  Settings,
  updateSettings
};

let SETTINGS: Settings = {
  stringify: {
    abbreviatedList: false
  }
};

type Settings = {
  stringify?: {
    abbreviatedList?: boolean
  }
};

function updateSettings(settings: Settings) {
  SETTINGS = settings;
}
