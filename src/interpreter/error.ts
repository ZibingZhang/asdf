import {
  isAtomSExpr,
  SExpr
} from "./sexpr.js";
import {
  TokenType
} from "./token.js";
import {
  ordinalSuffixOf
} from "./utils.js";

export {
  DF_DUPLICATE_VARIABLE_ERR,
  DF_EXPECTED_AT_LEAST_ONE_PARAM_ERR,
  DF_EXPECTED_EXPR_ERR,
  DF_EXPECTED_FUNCTION_BODY_ERR,
  DF_EXPECTED_FUNCTION_NAME_ERR,
  DF_EXPECTED_VARIABLE_ERR,
  DF_FIRST_ARG_ERR,
  DF_TOO_MANY_EXPRS_ERR,
  DF_TOO_MANY_FUNCTION_BODIES_ERR,
  DF_PREVIOUSLY_DEFINED_NAME_ERR,
  EL_EXPECT_FINISHED_EXPR_ERR,
  FA_ARITY_ERR,
  FA_DIV_BY_ZERO_ERR,
  FA_MIN_ARITY_ERR,
  FA_NTH_WRONG_TYPE_ERR,
  FA_QUESTION_NOT_BOOL_ERR,
  FA_WRONG_TYPE_ERR,
  FC_EXPECTED_FUNCTION_ERR,
  IF_EXPECTED_THREE_PARTS_ERR,
  QU_EXPECTED_POST_QUOTE_ERR,
  RS_BAD_SYNTAX_ERR,
  RS_DIV_BY_ZERO_ERR,
  RS_EXPECTED_CLOSING_PAREN_ERR,
  RS_EXPECTED_COMMENTED_OUT_ELEMENT_ERR,
  RS_EXPECTED_CORRECT_CLOSING_PAREN_ERR,
  RS_EXPECTED_ELEMENT_FOR_QUOTING_ERR,
  RS_EXPECTED_ELEMENT_FOR_QUOTING_IMMEDIATELY_ERR,
  RS_ILLEGAL_USE_OF_DOT_ERR,
  RS_NESTED_QUOTES_UNSUPPORTED_ERR,
  RS_QUASI_QUOTE_UNSUPPORTED_ERR,
  RS_UNCLOSED_STRING_ERR,
  RS_UNEXPECTED_ERR,
  RT_EXCEEDED_RECURSION_DEPTH,
  SC_UNDEFINED_FUNCTION_ERR,
  SC_UNDEFINED_VARIABLE_ERR,
  SC_USED_BEFORE_DEFINITION_ERR,
  SX_EXPECTED_OPEN_PAREN_ERR,
  SX_NOT_TOP_LEVEL_DEFN_ERR,
  WF_EXPECTED_OPEN_PARENTHESIS_ERR
};

function foundStr(found: SExpr | string): string {
  if (typeof found === "string") {
    return found.toString();
  } else {
    if (isAtomSExpr(found)) {
      switch (found.token.type) {
        case TokenType.TRUE:
        case TokenType.FALSE:
          return "boolean";
        case TokenType.INTEGER:
        case TokenType.RATIONAL:
        case TokenType.DECIMAL:
          return "number";
        case TokenType.STRING:
          return "string";
        case TokenType.KEYWORD:
          return "keyword";
        case TokenType.PLACEHOLDER:
          return "template";
        default:
          throw "illegal state: unsupported token type";
      }
    } else {
      return "part";
    }
  }
}

const DF_DUPLICATE_VARIABLE_ERR = (name: string) => {
  return `define: found a variable that is used more than once: ${name}`;
};
const DF_EXPECTED_AT_LEAST_ONE_PARAM_ERR = "define: expected at least one variable after the function name, but found none";
const DF_EXPECTED_EXPR_ERR = (name: string) => {
  return `define: expected an expression after the variable name ${name}, but nothing's there`;
};
const DF_EXPECTED_FUNCTION_BODY_ERR = "define: expected an expression for the function body, but nothing's there";
const DF_EXPECTED_FUNCTION_NAME_ERR = (found: SExpr | null = null) => {
  return `define: expected the name of the function, but ${found ? `found a ${foundStr(found)}` : "nothing's there" }`;
};
const DF_EXPECTED_VARIABLE_ERR = (found: SExpr) => {
  return `define: expected a variable, but found a ${foundStr(found)}`;
};
const DF_FIRST_ARG_ERR = (found: SExpr | null = null) => {
  return `define: expected a variable name, or a function name and its variables (in parentheses), but ${found ? `found a ${foundStr(found)}` : "nothing's there"}`;
};
const DF_TOO_MANY_EXPRS_ERR = (name: string, parts: number) => {
  return `define: expected only one expression after the variable name ${name}, but found ${parts} extra part${parts > 1 ? "s" : ""}`;
};
const DF_TOO_MANY_FUNCTION_BODIES_ERR = (parts: number) => {
  return `define: expected only one expression for the function body, but found ${parts} extra part${parts > 1 ? "s" : ""}`;
};
const DF_PREVIOUSLY_DEFINED_NAME_ERR = (name: string) => {
  return `${name}: this name was defined previously and cannot be re-defined`;
};

const EL_EXPECT_FINISHED_EXPR_ERR = "...: expected a finished expression, but found a template";

const FA_ARITY_ERR = (name: string, expected: number, actual: number) => {
  if (expected < actual) {
    return `${name}: expects only ${expected} argument${expected > 1 ? "s" : ""}, but found ${actual}`;
  } else {
    return `${name}: expects ${expected} argument${expected > 1 ? "s" : ""}, but found ${actual === 0 ? "none" : `only ${actual}`}`;
  }
};
const FA_DIV_BY_ZERO_ERR = "/: division by zero";
const FA_MIN_ARITY_ERR = (name: string, expected: number, actual: number) => {
  return `${name}: expects at least ${expected} argument${expected > 1 ? "s" : ""}, but found ${actual >= 2 ? actual : actual === 1 ? "only 1" : "none"}`;
};
const FA_NTH_WRONG_TYPE_ERR = (name: string, n: number, expected: string, actual: string) => {
  return `${name}: expects a ${expected} as ${ordinalSuffixOf(n + 1)} argument, given ${actual}`;
};
const FA_QUESTION_NOT_BOOL_ERR = (name: string, found: string) => {
  return `${name}: question result is not true or false: ${found}`;
};
const FA_WRONG_TYPE_ERR = (name: string, expected: string, actual: string) => {
  return `${name}: expects a ${expected}, given ${actual}`;
};

const FC_EXPECTED_FUNCTION_ERR = (found: SExpr | string | null = null) => {
  return `function call: expected a function after the open parenthesis, but ${found ? `found a ${foundStr(found)}`: "nothing's there"}`;
};

const IF_EXPECTED_THREE_PARTS_ERR = (parts: number) => {
  if (parts === 0) {
    return "if: expected a question and two answers, but nothing's there";
  } else if (parts === 1) {
    return "if: expected a question and two answers, but found only 1 part";
  } else if (parts === 2) {
    return "if: expected a question and two answers, but found only 2 parts";
  } else {
    return `if: expected a question and two answers, but found ${parts} parts`;
  }
};

const QU_EXPECTED_POST_QUOTE_ERR = (found: SExpr) => {
  return `quote: expected the name of a symbol or () after the quote, but found a ${foundStr(found)}`;
};

const RS_BAD_SYNTAX_ERR = (syntax: string) => {
  return `read-syntax: bad syntax \`${syntax}\``;
};
const RS_DIV_BY_ZERO_ERR = (number: string) => {
  return `read-syntax: division by zero in \`${number}\``;
};
const RS_EXPECTED_CLOSING_PAREN_ERR = (opening: string) => {
  if (opening === "(") {
    return "read-syntax: expected a `)` to close preceding `(`";
  } else if (opening === "[") {
    return "read-syntax: expected a `]` to close preceding `[`";
  } else {
    return "read-syntax: expected a `}` to close preceding `{`";
  }
};
const RS_EXPECTED_COMMENTED_OUT_ELEMENT_ERR = "read-syntax: expected a commented-out element for `#;`, but found end-of-file";
const RS_EXPECTED_CORRECT_CLOSING_PAREN_ERR = (opening: string | null, found: string): string => {
  if (opening === "(") {
    return `read-syntax: expected \`)\` to close preceding \`(\`, found instead \`${found}\``;
  } else if (opening === "[") {
    return `read-syntax: expected \`]\` to close preceding \`[\`, found instead \`${found}\``;
  } else {
    return `read-syntax: expected \`}\` to close preceding \`{\`, found instead \`${found}\``;
  }
};
const RS_EXPECTED_ELEMENT_FOR_QUOTING_ERR = (found: string) => {
  return `read-syntax: expected an element for quoting "'", but found ${found}`;
};
const RS_EXPECTED_ELEMENT_FOR_QUOTING_IMMEDIATELY_ERR = "read-syntax: expected an element for quoting immediately after quote";
const RS_ILLEGAL_USE_OF_DOT_ERR = "read-syntax: illegal use of `.`";
const RS_NESTED_QUOTES_UNSUPPORTED_ERR = "read-syntax: nested quotes are not supported";
const RS_QUASI_QUOTE_UNSUPPORTED_ERR = "read-syntax: quasiquotes are not supported";
const RS_UNCLOSED_STRING_ERR = "read-syntax: expected a closing `\"`";
const RS_UNEXPECTED_ERR = (found: string) => {
  return `read-syntax: unexpected \`${found}\``;
};

const RT_EXCEEDED_RECURSION_DEPTH = "runtime: recursion depth exceeded";

const SC_UNDEFINED_FUNCTION_ERR = (name: string) => {
  return `${name}: this function is undefined`;
};
const SC_UNDEFINED_VARIABLE_ERR = (name: string) => {
  return `${name}: this variable is not defined`;
};
const SC_USED_BEFORE_DEFINITION_ERR = (name: string) => {
  return `${name} is used here before its definition`;
};

const SX_EXPECTED_OPEN_PAREN_ERR = (name: string) => {
  return `${name}: expected an open parenthesis before ${name}, but found none`;
};
const SX_NOT_TOP_LEVEL_DEFN_ERR = (name: string) => {
  return `${name}: found a definition that is not at the top level`;
};

const WF_EXPECTED_OPEN_PARENTHESIS_ERR = (name: string) => {
  return `${name}: expected a function call, but there is no open parenthesis before this function`;
};
