/* eslint-disable @typescript-eslint/no-explicit-any */

export {
  Pipeline,
  Stage,
  StageError,
  StageOutput
};
class StageError {
  constructor(
    readonly lineno: number,
    readonly colno: number,
    readonly text: string,
    readonly msg: string
  ) {}
}

class StageOutput {
  readonly output: any;
  readonly errors: StageError[];

  constructor(output: any, errors: StageError[] = []) {
    this.output = output;
    this.errors = errors;
  }
}

interface Stage {
  run(input: StageOutput): StageOutput;
}

class Pipeline {
  readonly stages: Stage[];

  constructor(stages: Stage[]) {
    this.stages = stages;
  }

  run(program: string) {
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
