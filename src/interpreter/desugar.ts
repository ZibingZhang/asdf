import {
  Stage,
  StageOutput
} from "./pipeline.js";

export {
  DESUGAR_STAGE
};

class Desugar implements Stage {
  run(input: StageOutput): StageOutput {
    return input;
  }
}

const DESUGAR_STAGE = new Desugar();
