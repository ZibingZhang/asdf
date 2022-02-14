import {
  SourceSpan
} from "../data/sourcespan";

export {
  Token,
  TokenType
};

enum TokenType {
  LeftParen,
  True,
  False,
  Character,
  String,
  Name,
  Keyword,
  Integer,
  Rational,
  Decimal,
  Placeholder
}

class Token {
  constructor(
    readonly type: TokenType,
    readonly text: string,
    readonly sourceSpan: SourceSpan
  ) {}
}
