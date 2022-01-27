/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
declare let CodeMirror: any;

type Bracket = {
  ch: string,
  col: number,
  imm: string | null  // first name token following the open bracket
}

type State = {
  tokenize: (stream: any, state: State) => string | null,
  bracketStack: Bracket[]
}

(function(mod) {
  // Plain browser env
  {mod(CodeMirror);}
})(function(CodeMirror: any) {
  "use strict";

  CodeMirror.defineMode("racket", function(_config: any) {
    const untilDelimiter = /^[^\s"'([{)\]};`,]*/;
    const openBrackets = "([{";
    const closeBrackets = ")]}";
    const booleanLiteral = /^(T|t|true|F|f|false)$/;
    const specialForm = /^(and|check-error|check-expect|check-member-of|check-random|check-range|check-satisfied|check-within|cond|define|define-struct|else|if|lambda|letrec|let\*|let|local|or|quasiquote|quote|require|unquote)$/;
    const numLiteral = /^[+-]?(\.\d+|\d+(\.\d*|\/\d+)?)$/;
    const exactnessNumLiteral = /^[ei]?[+-]?(\.\d+|\d+(\.\d*|\/\d+)?)$/;
    const specialCharacter = /^(nul|null|backspace|tab|newline|linefeed|vtab|page|return|space|rubout)$/;
    const placeholder = /^\.{2,6}$/;

    const bracketMap = new Map([
      ["(", ")"],
      ["[", "]"],
      ["{", "}"]
    ]);

    function tokenBase(stream: any, state: State) {
      if (stream.eatSpace()) {
        return null;
      }

      let ch = stream.next();

      if (openBrackets.includes(ch)) {
        state.bracketStack.push({
          ch,
          col: stream.column(),
          imm: null
        });
        return "bracket";
      } else if (closeBrackets.includes(ch)) {
        if (state.bracketStack.length === 0) {
          return "error";
        } else {
          if (ch === bracketMap.get(state.bracketStack.pop()!.ch)) {
            return "bracket";
          } else {
            return "error";
          }
        }
      } else if (ch === ";") {
        stream.skipToEnd();
        return "comment";
      } else if (ch.match(/^['`]/)) {
        return "keyword";
      } else if (ch.match(/^['`,]/)) {
        return "keyword";
      } else if (ch === "\"") {
        state.tokenize = tokenString;
        return "string";
      } else if (ch === "#") {
        if (stream.eol() || stream.peek().match(/^\s/)) {
          return "error";
        } else if (stream.match(/^![/ ]/)) {
          stream.skipToEnd();
          return "comment";
        }

        ch = stream.next();
        if (ch === ";") {
          return "comment";
        } else if (ch === "|") {
          state.tokenize = tokenComment(0);
          return state.tokenize(stream, state);
        } else if (ch === "\\") {
          if (stream.eol()) {
            if (stream.lookAhead(1) === undefined) {
              return "error";
            } else {
              return "character";
            }
          }
          ch = stream.next();
          if (!ch.match(/[a-z]/i)) {
            return "character";
          }
          const characterName = ch + stream.match(/[a-z]*/)[0];
          if (characterName.length === 1 || characterName.match(specialCharacter)) {
            return "character";
          } else {
            return "error";
          }
        }

        const poundName = ch + stream.match(untilDelimiter)[0];
        if (poundName.match(booleanLiteral)) {
          return "boolean";
        } else if (poundName.match(exactnessNumLiteral)) {
          return "number";
        } else {
          return "error";
        }
      }

      const name = ch + stream.match(untilDelimiter);
      if (name.match(specialForm)) {
        return "keyword";
      } else if (name.match(numLiteral)) {
        return "number";
      } else if (name.match(placeholder)) {
        return "placeholder";
      } else {
        return null;
      }
    }

    function tokenComment(depth: number): ((stream: any, state: State) => string | null) {
      return function(stream: any, state: State) {
        const m = stream.match(/^.*?(#\||\|#)/);
        if (!m) {
          stream.skipToEnd();
        } else if (m[1] == "#|") {
          state.tokenize = tokenComment(depth + 1);
        } else if (depth > 0) {
          state.tokenize = tokenComment(depth - 1);
        } else {
          state.tokenize = tokenBase;
        }
        return "comment";
      };
    }

    function tokenString(stream: any, state: State): string | null {
      if (stream.eatSpace()) {
        return null;
      }
      while (!stream.eol()) {
        if (stream.peek() === "\\") {
          state.tokenize = tokenEscapedCharacter;
          return "string";
        }
        const ch = stream.next();
        if (ch === "\"") {
          state.tokenize = tokenBase;
          return "string";
        }
      }
      return "string";
    }

    function tokenEscapedCharacter(stream: any, state: State) {
      stream.next();
      if (stream.eol()) {
        state.tokenize = tokenString;
        return "string";
      }
      const ch = stream.next();
      state.tokenize = tokenString;
      if (ch.match(/[abtnvfre"'\\]/)) {
        return "string";
      } else {
        return "error";
      }
    }

    return {
      startState: function (): State {
        return {
          tokenize: tokenBase,
          bracketStack: []
        };
      },

      token: function (stream: any, state: State): string | null {
        const style = state.tokenize(stream, state);
        return style;
      },

      indent: function (state: State, _textAfter: any): number {
        if (state.bracketStack.length === 0) {
          return 0;
        } else {
          return state.bracketStack.at(-1)!.col + 1;
        }
      },

      closeBrackets: { pairs: "()[]{}\"\"" },
      lineComment: ";",
      blockCommentStart: "#|",
      blockCommentEnd: "|#"
    };
  });
});
