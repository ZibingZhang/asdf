/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
type CodeMirror = any;
declare let CodeMirror: CodeMirror;

type SExpr = {
  ch: string,
  col: number,
  parent: SExpr | null,
  exprCounter: number,
  specialIndent: number | null,
  specialIndentName: string | null,
  firstChildCol: number | null,
  secondChildCol: number | null,
  isCommented: boolean
}

const BASE_SEXPR = {
  exprCounter: 0,
  specialIndent: null,
  specialIndentName: null,
  firstChildCol: null,
  secondChildCol: null
}

type State = {
  tokenize: (stream: any, state: State) => TokenType | null,
  sexpr: SExpr | null,
  sexprComment: number,
  expectingQuoted: boolean
}

enum TokenType {
  BRACKET = "bracket",
  BOOLEAN = "boolean",
  CHARACTER = "character",
  COMMENT = "comment",
  ERROR = "error",
  KEYWORD = "keyword",
  NAME = "name",
  NUMBER = "number",
  PLACEHOLDER = "placeholder",
  STRING = "string"
}

const QUOTABLE_TYPES = new Set([
  TokenType.BOOLEAN,
  TokenType.CHARACTER,
  TokenType.ERROR,
  TokenType.KEYWORD,
  TokenType.NAME,
  TokenType.NUMBER,
  TokenType.PLACEHOLDER,
  TokenType.STRING
]);

(function(mod) {
  // Plain browser env
  {mod(CodeMirror);}
})(function(CodeMirror: CodeMirror) {
  "use strict";

  CodeMirror.defineMode("racket", function(_config: any) {
    const untilDelimiter = /^[^\s"'([{)\]};`,]*/;
    const openBrackets = "([{";
    const closeBrackets = ")]}";
    const booleanLiteral = /^(T|t|true|F|f|false)$/;
    const specialForm = /^(and|check-error|check-expect|check-member-of|check-random|check-range|check-satisfied|check-within|cond|define|define-struct|else|if|lambda|letrec|let\*|let|local|or|quasiquote|quote|require|unquote)$/;
    const numLiteral = /^[+-]?(\.\d+|\d+(\.\d*|\/\d+)?)$/;
    const exactnessNumLiteral = /^[ei][+-]?(\.\d+|\d+(\.\d*|\/\d+)?)$/;
    const specialCharacter = /^(nul|null|backspace|tab|newline|linefeed|vtab|page|return|space|rubout)$/;
    const placeholder = /^\.{2,6}$/;

    const bracketMap = new Map([
      ["(", ")"],
      ["[", "]"],
      ["{", "}"]
    ]);

    function setChildCol(state: State, col: number) {
      if (state.sexpr === null) return;
      if (state.sexpr.firstChildCol === null) {
        state.sexpr.firstChildCol = col;
      } else if (state.sexpr.secondChildCol === null) {
        state.sexpr.secondChildCol = col;
      }
    }

    function tokenType(state: State, type: TokenType, col: number | false): TokenType {
      if (type && state.expectingQuoted && QUOTABLE_TYPES.has(type)) {
        state.expectingQuoted = false;
      } else if (state.sexpr !== null && col !== false) {
        state.sexpr.exprCounter++;
        if (type !== TokenType.BRACKET) {
          setChildCol(state, col);
        }
      }
      if (state.sexpr && state.sexpr.isCommented) {
        return TokenType.COMMENT;
      } else if (state.sexprComment > 0) {
        state.sexprComment--;
        return TokenType.COMMENT;
      } else {
        return type;
      }
    }

    function tokenBase(stream: any, state: State): TokenType | null {
      if (stream.eatSpace()) {
        return null;
      }

      let ch = stream.next();
      let col = stream.column();

      if (openBrackets.includes(ch)) {
        if (state.expectingQuoted) {
          state.expectingQuoted = false;
        } else {
          setChildCol(state, col);
        }
        state.sexpr = {
          ch,
          col,
          parent: state.sexpr,
          isCommented: state.sexprComment > 0,
          ...BASE_SEXPR
        }
        return tokenType(state, TokenType.BRACKET, col);
      } else if (closeBrackets.includes(ch)) {
        if (state.sexpr === null) {
          return tokenType(state, TokenType.ERROR, col);
        } else {
          let openingBracket = state.sexpr.ch;
          state.sexpr = state.sexpr.parent;
          if (ch === bracketMap.get(openingBracket)) {
            return tokenType(state, TokenType.BRACKET, col);
          } else {
            return tokenType(state, TokenType.ERROR, col);
          }
        }
      } else if (ch === ";") {
        stream.skipToEnd();
        return TokenType.COMMENT;
      } else if (ch.match(/^['`,]/)) {
        let type = tokenType(state, TokenType.KEYWORD, col);
        state.expectingQuoted = true;
        return type;
      } else if (ch === "\"") {
        state.tokenize = tokenString;
        return tokenType(state, TokenType.STRING, col);
      } else if (ch === "#") {
        if (stream.eol() || stream.peek().match(/^\s/)) {
          return tokenType(state, TokenType.ERROR, col);
        } else if (stream.match(/^![/ ]/)) {
          stream.skipToEnd();
          return TokenType.COMMENT;
        }

        ch = stream.next();
        if (ch === ";") {
          state.sexprComment++;
          return TokenType.COMMENT;
        } else if (ch === "|") {
          state.tokenize = tokenBlockComment(0);
          return state.tokenize(stream, state);
        } else if (ch === "\\") {
          if (stream.eol()) {
            if (stream.lookAhead(1) === undefined) {
              return tokenType(state, TokenType.ERROR, col);
            } else {
              return tokenType(state, TokenType.CHARACTER, col);
            }
          }
          ch = stream.next();
          if (!ch.match(/[a-z]/i)) {
            return tokenType(state, TokenType.CHARACTER, col);
          }
          const characterName = ch + stream.match(/[a-z]*/)[0];
          if (characterName.length === 1 || characterName.match(specialCharacter)) {
            return tokenType(state, TokenType.CHARACTER, col);
          } else {
            return tokenType(state, TokenType.ERROR, col);
          }
        }

        const poundName = ch + stream.match(untilDelimiter)[0];
        if (poundName.match(booleanLiteral)) {
          return tokenType(state, TokenType.BOOLEAN, col);
        } else if (poundName.match(exactnessNumLiteral)) {
          return tokenType(state, TokenType.NUMBER, col);
        } else {
          return tokenType(state, TokenType.ERROR, col);
        }
      }

      const name = ch + stream.match(untilDelimiter);
      if (name.match(specialForm)) {
        if (state.sexpr) {
          switch (name) {
            case "cond":
            case "define":
            case "let": {
              state.sexpr.specialIndent = 2;
              state.sexpr.specialIndentName = name;
              break;
            }
          }
        }
        return tokenType(state, TokenType.KEYWORD, col);
      } else if (name.match(numLiteral)) {
        return tokenType(state, TokenType.NUMBER, col);
      } else if (name.match(placeholder)) {
        return tokenType(state, TokenType.PLACEHOLDER, col);
      } else {
        return tokenType(state, TokenType.NAME, col);
      }
    }

    function tokenBlockComment(depth: number): ((stream: any, state: State) => TokenType) {
      return function(stream: any, state: State) {
        const m = stream.match(/^.*?(#\||\|#)/);
        if (!m) {
          stream.skipToEnd();
        } else if (m[1] == "#|") {
          state.tokenize = tokenBlockComment(depth + 1);
        } else if (depth > 0) {
          state.tokenize = tokenBlockComment(depth - 1);
        } else {
          state.tokenize = tokenBase;
        }
        return TokenType.COMMENT;
      };
    }

    function tokenString(stream: any, state: State): TokenType {
      if (stream.eatSpace()) {
        return TokenType.STRING;
      }
      while (!stream.eol()) {
        if (stream.match("\\\"")) {
          continue;
        }
        const ch = stream.next();
        if (ch === "\"") {
          state.tokenize = tokenBase;
          return tokenType(state, TokenType.STRING, false);
        }
      }
      return tokenType(state, TokenType.STRING, false);
    }

    return {
      startState: function (): State {
        return {
          tokenize: tokenBase,
          sexpr: null,
          sexprComment: 0,
          expectingQuoted: false
        };
      },

      token: function (stream: any, state: State): string | null {
        const style = state.tokenize(stream, state);
        return style;
      },

      indent: function (state: State, _textAfter: any): number {
        if (state.sexpr === null) {
          return 0;
        } else {
          if (state.sexpr.specialIndent) {
            if (
              state.sexpr.specialIndentName === "let"
              && state.sexpr.secondChildCol === null
            ) {
              return (state.sexpr.firstChildCol || 0) + 3
            } else {
              return state.sexpr.specialIndent;
            }
          } else {
            return (
            state.sexpr.secondChildCol
            || state.sexpr.firstChildCol
            || state.sexpr.col + 1
          );
          }
        }
      },

      closeBrackets: { pairs: "()[]{}\"\"" },
      lineComment: ";",
      blockCommentStart: "#|",
      blockCommentEnd: "|#"
    };
  });
});
