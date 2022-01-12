import {
  Pipeline
} from "./pipeline";
import {
  Settings,
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
  updateSettings: settings => updateSettings(<Settings>settings),
  pipeline: new Pipeline()
};
