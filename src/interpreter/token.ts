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
  readonly lineno: number;
  readonly colno: number;
  readonly type: TokenType;
  readonly text: string;

  constructor(lineno: number, colno: number, type: TokenType, text: string) {
    this.lineno = lineno;
    this.colno = colno;
    this.type = type;
    this.text = text;
  }
}
