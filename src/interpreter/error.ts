import { ordinalSuffixOf } from "./utils.js";

export {
  FA_MIN_ARITY_ERR,
  FA_NTH_WRONG_TYPE_ERR,
  FC_EXPECTED_FUNCTION_ERR,
  Q_EXPECTED_POST_QUOTE_ERR,
  RS_BAD_SYNTAX_ERR,
  RS_DIV_BY_ZERO_ERR,
  RS_EXPECTED_CLOSING_PAREN_ERR,
  RS_EXPECTED_COMMENTED_OUT_ELEMENT_ERR,
  RS_EXPECTED_CORRECT_CLOSING_PAREN_ERR,
  RS_EXPECTED_ELEMENT_FOR_QUOTING_ERR,
  RS_ILLEGAL_USE_OF_DOT_ERR,
  RS_NESTED_QUOTES_UNSUPPORTED_ERR,
  RS_QUASI_QUOTE_UNSUPPORTED_ERR,
  RS_UNCLOSED_STRING_ERR,
  RS_UNEXPECTED_ERR
};

const FA_MIN_ARITY_ERR = (name: string, expected: number, actual: number) => {
  return `${name}: expects at least ${expected} arguments, but found ${actual >= 2 ? actual : actual === 1 ? "only 1" : "none"}`;
};
const FA_NTH_WRONG_TYPE_ERR = (name: string, n: number, expected: string, actual: string) => {
  return `${name}: expects a ${expected} as ${ordinalSuffixOf(n + 1)} argument, given ${actual}`;
};

const FC_EXPECTED_FUNCTION_ERR = (found: string | null) => {
  return `function call: expected a function after the open parenthesis, but ${found ? `found a ${found}`: "nothing's there"}`;
};

const Q_EXPECTED_POST_QUOTE_ERR = (found: string) => {
  return `quote: expected the name of a symbol or () after the quote, but found a ${found}`;
}

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
const RS_ILLEGAL_USE_OF_DOT_ERR = "read-syntax: illegal use of `.`";
const RS_NESTED_QUOTES_UNSUPPORTED_ERR = "read-syntax: nested quotes are not supported";
const RS_QUASI_QUOTE_UNSUPPORTED_ERR = "read-syntax: quasiquotes are not supported";
const RS_UNCLOSED_STRING_ERR = "read-syntax: expected a closing `\"`";
const RS_UNEXPECTED_ERR = (found: string) => {
  return `read-syntax: unexpected \`${found}\``;
};
