/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  StageError,
  StageOutput,
  StageTestResult
} from "../data/stage";
import {
  CompileCode
} from "./compile";
import {
  EvaluateCode
} from "./evaluate";
import {
  GenerateLabels
} from "./label";
import {
  Global
} from "../global";
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
  SETTINGS
} from "../settings";
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

declare let stopify: any;

class Pipeline {
  private global = new Global();
  private higherOrderFunctions = false;

  private LEXING_STAGE = new Lexer();
  private PARSING_SEXPRS_STAGE = new ParseSExpr();
  private WELL_FORMED_PROGRAM_STAGE = new WellFormedProgram();
  private GENERATE_LABELS_STAGE = new GenerateLabels();
  private COMPILE_CODE_STAGE = new CompileCode();
  private EVALUATE_CODE_STAGE = new EvaluateCode();
  private UNUSED_CODE_STAGE = new UnusedCode(() => { /* do nothing */ });

  private parsingOutput: StageOutput<Program> = new StageOutput(new Program([], []));

  private errorsCallback: (stageErrors: StageError[]) => void = () => { /* do nothing */ };
  private successCallback: (output: RValue[]) => void = () => { /* do nothing */ };
  private testResultsCallback: (testResults: StageTestResult[]) => void = () => { /* do nothing */ };
  private unusedCallback: ((sourceSpan: SourceSpan) => void) | null = null;

  private static ShortCircuitPipeline = class extends Error {
    constructor(readonly stageOutput: StageOutput<any>) {
      super();
    }
  };

  evaluateCode(code: string): void {
    if (this.higherOrderFunctions !== SETTINGS.higherOrderFunctions) {
      this.higherOrderFunctions = SETTINGS.higherOrderFunctions;
      if (this.higherOrderFunctions) {
        this.global.enableHigherOrderFunctions();
      } else {
        this.global.disableHigherOrderFunctions();
      }
    }
    try {
      this.evaluateCodeHelper(code);
    } catch (e) {
      if (!(e instanceof Pipeline.ShortCircuitPipeline)) {
        throw e;
      }
    }
  }

  evaluateCodeHelper(code: string): void {
    const initOutput: StageOutput<string> = new StageOutput(code);
    const lexingOutput = this.LEXING_STAGE.run(initOutput);
    this.handleErrors(lexingOutput);
    this.parsingOutput = this.PARSING_SEXPRS_STAGE.run(lexingOutput);
    this.handleErrors(this.parsingOutput);
    const wellFormedOutput = this.WELL_FORMED_PROGRAM_STAGE.run(this.parsingOutput);
    this.handleErrors(wellFormedOutput);
    const generateLabelsOutput = this.GENERATE_LABELS_STAGE.run(wellFormedOutput);
    const compileCodeOutput = this.COMPILE_CODE_STAGE.run(generateLabelsOutput);
    const [asyncRun, rvals] = this.EVALUATE_CODE_STAGE.run(compileCodeOutput).output;
    asyncRun.run((output: any) => {
      console.log(output)
      if (output.type === "normal") {
        this.successCallback(rvals);
      }
    });
    // this.handleErrors(evaluateCodeOutput, true);
    // this.successCallback(evaluateCodeOutput.output);
    // this.testResultsCallback(evaluateCodeOutput.tests);
    // if (this.unusedCallback) { this.UNUSED_CODE_STAGE.run(this.parsingOutput); }
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
