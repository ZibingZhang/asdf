import {
  Pipeline
} from "./pipeline/main";
import {
  updateSettings
} from "./settings";

declare global {
  interface Window {
    racket: {
      updateSettings: (settings: JSON) => void,
      pipeline: Pipeline
    }
  }
}

window.racket = {
  updateSettings: settings => updateSettings(settings),
  pipeline: new Pipeline()
};
