import {
  NO_SOURCE_SPAN,
  SourceSpan
} from "./sourcespan.js";

export {
  NO_TOKEN,
  Token,
  TokenType,
  tokenTypeName
};

enum TokenType {
  NONE = "NONE",
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

const NO_TOKEN = new Token(TokenType.NONE, "", NO_SOURCE_SPAN);

function tokenTypeName(type: TokenType): string {
  switch (type) {
    case TokenType.TRUE:
    case TokenType.FALSE:
      return "boolean";
    case TokenType.INTEGER:
    case TokenType.RATIONAL:
    case TokenType.DECIMAL:
      return "number";
    case TokenType.KEYWORD:
      return "keyword";
    default:
      throw "illegal state: unsupported token type";
  }
}
