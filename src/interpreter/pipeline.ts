export {
  Pipeline,
  Stage,
  StageOutput
};

type StageError = {
  readonly lineno: bigint,
  readonly msg: string
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
    for (let stage of this.stages) {
      nextInput = stage.run(nextInput);
      if (nextInput.errors.length > 0) {
        return nextInput.errors;
      }
    }
    return nextInput.output;
  }
}
