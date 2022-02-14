/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  StageError,
  StageResult,
  StageTestResult,
  makeStageResult
} from "../data/stage";
import {
  EvaluateCode
} from "./evaluate";
import {
  GenerateLabels
} from "./label";
import {
  Lexer
} from "./lexing";
import {
  ParseSExpr
} from "./parse";
import {
  Program
} from "../ir/program";
import {
  RNG
} from "../random";
import {
  RValue
} from "../values/rvalue";
import {
  SourceSpan
} from "../data/sourcespan";
import {
  UnusedCode
} from "./unused";
import {
  WellFormedProgram
} from "./well-formed";

export {
  Pipeline
};

class Pipeline {
  private LEXING_STAGE = new Lexer();
  private PARSING_SEXPRS_STAGE = new ParseSExpr();
  private WELL_FORMED_PROGRAM_STAGE = new WellFormedProgram();
  private GENERATE_LABELS_STAGE = new GenerateLabels();
  private EVALUATE_CODE_STAGE = new EvaluateCode();
  private UNUSED_CODE_STAGE = new UnusedCode(() => { /* do nothing */ });

  private errorsCallback: (stageErrors: StageError[]) => void = () => { /* do nothing */ };
  private successCallback: (output: RValue[]) => void = () => { /* do nothing */ };
  private testResultsCallback: (testResults: StageTestResult[]) => void = () => { /* do nothing */ };
  private unusedCallback: (sourceSpan: SourceSpan) => void = () => { /* do nothing */ };
  private reformatCallback: (code: string) => void = () => {/* do nothing */};

  private static ShortCircuitPipeline = class extends Error {
    constructor(readonly StageResult: StageResult<any>) {
      super();
    }
  };

  evaluateCode(code: string): void {
    try {
      this.evaluateCodeHelper(code);
    } catch (e) {
      if (!(e instanceof Pipeline.ShortCircuitPipeline)) {
        throw e;
      }
    }
  }

  evaluateCodeHelper(code: string): void {
    const initOutput: StageResult<string> = makeStageResult(code);
    const lexingOutput = this.LEXING_STAGE.run(initOutput);
    this.handleErrors(lexingOutput, null);
    const parsingOutput = this.PARSING_SEXPRS_STAGE.run(lexingOutput);
    this.handleErrors(parsingOutput, parsingOutput);
    const wellFormedOutput = this.WELL_FORMED_PROGRAM_STAGE.run(parsingOutput);
    this.handleErrors(wellFormedOutput, parsingOutput);
    this.GENERATE_LABELS_STAGE.run(wellFormedOutput);
    const evaluateCodeOutput = this.EVALUATE_CODE_STAGE.run(wellFormedOutput);
    this.handleErrors(evaluateCodeOutput, parsingOutput, true);
    this.successCallback(evaluateCodeOutput.output);
    this.testResultsCallback(evaluateCodeOutput.tests);
    this.UNUSED_CODE_STAGE.run(parsingOutput);
  }

  handleErrors(
    stageResult: StageResult<any>,
    program: StageResult<Program> | null,
    runUnusedCallback = false
  ) {
    if (stageResult.errors.length > 0) {
      this.errorsCallback(stageResult.errors);
      this.testResultsCallback(stageResult.tests);
      if (runUnusedCallback && program) {
        this.UNUSED_CODE_STAGE.run(program);
      }
      throw new Pipeline.ShortCircuitPipeline(stageResult);
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

  setUnusedCallback(unusedCallback: ((sourceSpan: SourceSpan) => void)) {
    this.unusedCallback = unusedCallback;
    this.UNUSED_CODE_STAGE = new UnusedCode(this.unusedCallback);
  }
}
