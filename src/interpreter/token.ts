import { NO_SOURCE_SPAN, SourceSpan } from "./sourcespan.js";

export {
  NO_TOKEN,
  Token,
  TokenType
};

enum TokenType {
  NONE = "NONE",
  LEFT_PAREN = "LEFT_PAREN",
  RIGHT_PAREN = "RIGHT_PAREN",
  TRUE = "TRUE",
  FALSE = "FALSE",
  SEXPR_COMMENT = "SEXPR_COMMENT",
  STRING = "STRING",
  NAME = "NAME",
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

const NO_TOKEN = new Token(TokenType.NONE, "", NO_SOURCE_SPAN);
