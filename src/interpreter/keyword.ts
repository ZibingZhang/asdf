/* eslint-disable @typescript-eslint/no-explicit-any */
export {
  ALL_KEYWORDS,
  Keyword
}

enum Keyword {
  And = "and",
  CheckError = "check-error",
  CheckExpect = "check-expect",
  CheckMemberOf = "check-member-of",
  CheckRandom = "check-random",
  CheckRange = "check-range",
  CheckSatisfied = "check-satisfied",
  CheckWithin = "check-within",
  Cond = "cond",
  Define = "define",
  DefineStruct = "define-struct",
  Else = "else",
  If = "if",
  Lambda = "lambda",
  Or = "or",
  Quote = "quote"
}

const ALL_KEYWORDS: string[] = [];

for (const keyword in Keyword) {
  ALL_KEYWORDS.push((<any>Keyword.valueOf())[keyword]);
}
