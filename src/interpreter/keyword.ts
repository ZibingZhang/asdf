/* eslint-disable @typescript-eslint/no-explicit-any */
export {
  SUPPORTED_KEYWORDS,
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

const ALL_KEYWORDS: Set<string> = new Set()
let SUPPORTED_KEYWORDS: Set<string> = new Set();

for (const keyword in Keyword) {
  ALL_KEYWORDS.add((<any>Keyword.valueOf())[keyword]);
}

SUPPORTED_KEYWORDS = ALL_KEYWORDS;
