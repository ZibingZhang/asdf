/* eslint-disable @typescript-eslint/no-explicit-any */

import { SourceSpan } from "./sourcespan.js";

export {
  Pipeline,
  Stage,
  StageError,
  StageOutput
};
class StageError extends Error {
  constructor(
    readonly sourcespan: SourceSpan,
    readonly msg: string
  ) {
    super(msg);
  }
}

class StageOutput {
  constructor(
    readonly output: any,
    readonly errors: StageError[] = []
  ) {}
}

interface Stage {
  run(input: StageOutput): StageOutput;
}

class Pipeline {
  readonly stages: Stage[];

  constructor(stages: Stage[]) {
    this.stages = stages;
  }

  run(program: string): StageOutput {
    let nextInput = new StageOutput(program);
    for (const stage of this.stages) {
      nextInput = stage.run(nextInput);
      if (nextInput.errors.length > 0) {
        return nextInput;
      }
    }
    return nextInput;
  }
}
