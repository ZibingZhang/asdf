import {
  SourceSpan
} from "./sourcespan";

export {
  Token,
  TokenType
};

enum TokenType {
  LeftParen = "LEFT_PAREN",
  // RightParen = "RIGHT_PAREN",
  True = "TRUE",
  False = "FALSE",
  Character = "CHARACTER",
  String = "STRING",
  Name = "NAME",
  Keyword = "KEYWORD",
  Integer = "INTEGER",
  Rational = "RATIONAL",
  Decimal = "DECIMAL",
  Placeholder = "PLACEHOLDER"
}

class Token {
  constructor(
    readonly type: TokenType,
    readonly text: string,
    readonly sourceSpan: SourceSpan
  ) {}
}
