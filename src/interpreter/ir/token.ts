import {
  SourceSpan
} from "../data/sourcespan";

export {
  Token,
  TokenType
};

enum TokenType {
  LeftParen = "LEFT_PAREN",
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
