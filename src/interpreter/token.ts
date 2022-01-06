import {
  SourceSpan
} from "./sourcespan.js";

export {
  Token,
  TokenType
};

enum TokenType {
  LEFT_PAREN = "LEFT_PAREN",
  RIGHT_PAREN = "RIGHT_PAREN",
  TRUE = "TRUE",
  FALSE = "FALSE",
  STRING = "STRING",
  NAME = "NAME",
  KEYWORD = "KEYWORD",
  INTEGER = "INTEGER",
  RATIONAL = "RATIONAL",
  DECIMAL = "DECIMAL",
  PLACEHOLDER = "PLACEHOLDER"
}

class Token {
  constructor(
    readonly type: TokenType,
    readonly text: string,
    readonly sourceSpan: SourceSpan
  ) {}
}
