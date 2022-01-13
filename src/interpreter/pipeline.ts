/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  EvaluateCode
} from "./evaluate";
import {
  Lexer
} from "./lexing";
import {
  ParseSExpr
} from "./parse";
import {
  Program
} from "./program";
import {
  RNG
} from "./random";
import {
  SExpr
} from "./sexpr";
import {
  SourceSpan
} from "./sourcespan";
import {
  WellFormedProgram
} from "./well-formed";

export {
  Pipeline,
  Stage,
  StageError,
  StageOutput,
  StageTestResult
};

class StageError extends Error {
  constructor(
    readonly msg: string,
    readonly sourceSpan: SourceSpan
  ) {
    super(msg);
  }
}

class StageTestResult {
  constructor(
    readonly passed: boolean,
    readonly errMsg: string,
    readonly sourceSpan: SourceSpan
  ) {}
}

class StageOutput<T> {
  constructor(
    readonly output: T,
    readonly errors: StageError[] = [],
    readonly tests: StageTestResult[] = []
  ) {}
}

interface Stage<S, T> {
  run(input: StageOutput<S>): StageOutput<T>;
}

class Pipeline {
  private LEXING_STAGE = new Lexer();
  private PARSING_SEXPRS_STAGE = new ParseSExpr();
  private WELL_FORMED_PROGRAM_STAGE = new WellFormedProgram();
  private EVALUATE_CODE_STAGE = new EvaluateCode();

  private errorsCallback: (stageErrors: StageError[]) => void = () => {};
  private successCallback: (output: string[]) => void = () => {};
  private testResultsCallback: (testResults: StageTestResult[]) => void = () => {};

  private static ShortCircuitPipeline = class extends Error {
    constructor(readonly stageOutput: StageOutput<any>) {
      super();
    }
  }

  evaluateCode(code: string): StageOutput<any> {
    try {
      return this.evaluateCodeHelper(code);
    } catch (e) {
      if (e instanceof Pipeline.ShortCircuitPipeline) {
        return e.stageOutput;
      } else {
        throw e;
      }
    }
  }

  evaluateCodeHelper(code: string): StageOutput<any> {
    const initOutput: StageOutput<string> = new StageOutput(code);
    const lexingOutput: StageOutput<SExpr[]> = this.LEXING_STAGE.run(initOutput);
    this.handleErrors(lexingOutput);
    const parsingOutput: StageOutput<Program> = this.PARSING_SEXPRS_STAGE.run(lexingOutput);
    this.handleErrors(parsingOutput);
    const wellFormedOutput: StageOutput<Program> = this.WELL_FORMED_PROGRAM_STAGE.run(parsingOutput);
    this.handleErrors(wellFormedOutput);
    const evaluateCodeOutput: StageOutput<string[]> = this.EVALUATE_CODE_STAGE.run(wellFormedOutput);
    this.handleErrors(evaluateCodeOutput);
    this.successCallback(evaluateCodeOutput.output);
    this.testResultsCallback(evaluateCodeOutput.tests);
    return evaluateCodeOutput;
  }

  handleErrors(stageOutput: StageOutput<any>) {
    if (stageOutput.errors.length > 0) {
      this.errorsCallback(stageOutput.errors);
      this.testResultsCallback(stageOutput.tests);
      throw new Pipeline.ShortCircuitPipeline(stageOutput);
    }
  }

  reset() {
    RNG.reset();
    this.WELL_FORMED_PROGRAM_STAGE.reset();
    this.EVALUATE_CODE_STAGE.reset();
  }

  setErrorsCallback(errorsCallback: (stageErrors: StageError[]) => void) {
    this.errorsCallback = errorsCallback;
  }

  setSuccessCallback(successCallback: (output: string[]) => void) {
    this.successCallback = successCallback;
  }

  setTestResultsCallback(testResultCallback: (testResults: StageTestResult[]) => void) {
    this.testResultsCallback = testResultCallback;
  }
}
