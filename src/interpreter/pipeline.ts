/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  SourceSpan
} from "./sourcespan.js";

export {
  Pipeline,
  Stage,
  StageError,
  StageOutput
};

class StageError extends Error {
  constructor(
    readonly msg: string,
    readonly sourcespan: SourceSpan
  ) {
    super(msg);
  }
}

class StageOutput<T> {
  constructor(
    readonly output: T,
    readonly errors: StageError[] = []
  ) {}
}

interface Stage<S, T> {
  run(input: StageOutput<S>): StageOutput<T>;
}

class Pipeline {
  readonly stages: Stage<any, any>[];

  constructor(stages: Stage<any, any>[]) {
    this.stages = stages;
  }

  run(program: string): StageOutput<any> {
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
