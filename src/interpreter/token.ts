export {
  Token,
  TokenType
};

enum TokenType {
  LEFT_PAREN = "LEFT_PAREN",
  RIGHT_PAREN = "RIGHT_PAREN",
  TRUE = "TRUE",
  FALSE = "FALSE",
  QUOTE = "QUOTE",
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
    readonly lineno: number,
    readonly colno: number,
    readonly type: TokenType,
    readonly text: string
  ) {}
}
