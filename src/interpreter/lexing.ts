import { Stage, StageOutput } from "./pipeline.js";

export {
  Lexer
};

class Lexer implements Stage {
  run(program: StageOutput): StageOutput {
    console.log(program.output);
    return program;
  }
}
