import {
  Stage,
  StageOutput
} from "./pipeline.js";

export {
  Desugar
};

class Desugar implements Stage {
  run(input: StageOutput): StageOutput {
    return input;
  }
}
