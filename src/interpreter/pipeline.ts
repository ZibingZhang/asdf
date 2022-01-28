/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  EvaluateCode
} from "./evaluate";
import {
  Global
} from "./global";
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
  RValue
} from "./rvalue";
import {
  SETTINGS
} from "./settings";
import {
  SExpr
} from "./sexpr";
import {
  SourceSpan
} from "./sourcespan";
import {
  UnusedCode
} from "./unused";
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
  private global = new Global();
  private higherOrderFunctions = false;

  private LEXING_STAGE = new Lexer();
  private PARSING_SEXPRS_STAGE = new ParseSExpr();
  private WELL_FORMED_PROGRAM_STAGE = new WellFormedProgram();
  private EVALUATE_CODE_STAGE = new EvaluateCode();
  private UNUSED_CODE_STAGE = new UnusedCode(() => { /* do nothing */ });

  private lexingOutput: StageOutput<SExpr[]> = new StageOutput([]);
  private parsingOutput: StageOutput<Program> = new StageOutput(new Program([], []));
  private wellFormedOutput: StageOutput<Program> = new StageOutput(new Program([], []));
  private evaluateCodeOutput: StageOutput<RValue[]> = new StageOutput([]);

  private errorsCallback: (stageErrors: StageError[]) => void = () => { /* do nothing */ };
  private successCallback: (output: RValue[]) => void = () => { /* do nothing */ };
  private testResultsCallback: (testResults: StageTestResult[]) => void = () => { /* do nothing */ };
  private unusedCallback: ((sourceSpan: SourceSpan) => void) | null = null;

  private static ShortCircuitPipeline = class extends Error {
    constructor(readonly stageOutput: StageOutput<any>) {
      super();
    }
  };

  evaluateCode(code: string): StageOutput<any> {
    if (this.higherOrderFunctions !== SETTINGS.higherOrderFunctions) {
      this.higherOrderFunctions = SETTINGS.higherOrderFunctions;
      if (this.higherOrderFunctions) {
        this.global.enableHigherOrderFunctions();
      } else {
        this.global.disableHigherOrderFunctions();
      }
    }
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
    this.lexingOutput = this.LEXING_STAGE.run(initOutput);
    this.handleErrors(this.lexingOutput);
    this.parsingOutput = this.PARSING_SEXPRS_STAGE.run(this.lexingOutput);
    this.handleErrors(this.parsingOutput);
    this.wellFormedOutput = this.WELL_FORMED_PROGRAM_STAGE.run(this.parsingOutput);
    this.handleErrors(this.wellFormedOutput);
    this.evaluateCodeOutput = this.EVALUATE_CODE_STAGE.run(this.wellFormedOutput);
    this.handleErrors(this.evaluateCodeOutput, true);
    this.successCallback(this.evaluateCodeOutput.output);
    this.testResultsCallback(this.evaluateCodeOutput.tests);
    if (this.unusedCallback) { this.UNUSED_CODE_STAGE.run(this.parsingOutput); }
    return this.evaluateCodeOutput;
  }

  handleErrors(
    stageOutput: StageOutput<any>,
    runUnusedCallback = false
  ) {
    if (stageOutput.errors.length > 0) {
      this.errorsCallback(stageOutput.errors);
      this.testResultsCallback(stageOutput.tests);
      if (this.unusedCallback && runUnusedCallback) { this.UNUSED_CODE_STAGE.run(this.parsingOutput); }
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

  setSuccessCallback(successCallback: (output: RValue[]) => void) {
    this.successCallback = successCallback;
  }

  setTestResultsCallback(testResultCallback: (testResults: StageTestResult[]) => void) {
    this.testResultsCallback = testResultCallback;
  }

  setUnusedCallback(unusedCallback: ((sourceSpan: SourceSpan) => void) | null = null) {
    this.unusedCallback = unusedCallback;
    if (this.unusedCallback) { this.UNUSED_CODE_STAGE = new UnusedCode(this.unusedCallback); }
  }
}
