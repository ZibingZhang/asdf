(function(mod) {
  // Plain browser env
  {mod(CodeMirror);}
})(function(CodeMirror) {
  "use strict";

  CodeMirror.defineMode("racket", function (_config) {
    const untilDelimiter = /^[^\s"'([{)\]};`,]*/;
    const openBrackets = "([{";
    const closeBrackets = ")]}";
    const booleanLiteral = /^(T|t|true|F|f|false)$/;
    const specialForm = /^(and|check-error|check-expect|check-member-of|check-random|check-range|check-satisfied|check-within|cond|define|define-struct|else|if|lambda|or|quote|require)$/;
    const numLiteral = /^[+-]?(\.\d+|\d+(\.\d*|\/\d+)?)$/;
    const placeholder = /^\.{2,6}$/

    // unclosed block comments should be "error", but aren't
    function tokenComment(depth) {
      return function(stream, state) {
        const m = stream.match(/^.*?(#\||\|#)/);
        if (!m) {stream.skipToEnd();}
        else if (m[1] == "#|") {state.tokenize = tokenComment(depth + 1);}
        else if (depth > 0) {state.tokenize = tokenComment(depth - 1);}
        else {state.tokenize = tokenBase;}
        return "comment";
      };
    }

    function tokenBase(stream, state) {
      if (stream.eatSpace()) { return null; }

      let ch = stream.next();
      if (openBrackets.includes(ch) || closeBrackets.includes(ch)) { return "bracket"; }
      if (ch === ";") { stream.skipToEnd(); return "comment"; }
      if (ch.match(/^['`]/) && stream.match(specialForm, false)) { state.ignoreNextKeyword = true; return "keyword"; }
      if (ch.match(/^['`,]/)) { return "keyword"; }
      if (ch === "\"") {
        ch = stream.next();
        while (ch !== "\"") {
          if (stream.eol()) { return "error"; }
          ch = stream.next();
        }
        return "string";
      }
      if (ch === "#") {
        if (stream.eol() || stream.match(/^\s/, false)) { return "error"; }
        if (stream.match(/^![/ ]/)) { stream.skipToEnd(); return "comment"; }

        ch = stream.next();
        if (ch === ";") { return "comment"; }
        if (ch === "|") {
          state.tokenize = tokenComment(0);
          return state.tokenize(stream, state);
        }

        const poundName = ch + stream.match(untilDelimiter)[0];
        if (poundName.match(booleanLiteral)) { return "boolean"; }
        return "error";
      }

      const name = ch + stream.match(untilDelimiter);
      if (name.match(specialForm)) {
        if (state.ignoreNextKeyword) {
          state.ignoreNextKeyword = false;
          return null;
        } else {
          return "keyword";
        }
      }
      if (name.match(numLiteral)) { return "number"; }
      if (name.match(placeholder)) {return "placeholder";}
      return null;
    }

    return {
      startState: function () {
        return { tokenize: tokenBase, ignoreNextKeyword: false };
      },

      token: function (stream, state) {
        const style = state.tokenize(stream, state);
        return style;
      },

      indent: function (_state, _textAfter) {
        return 0;
      },

      closeBrackets: { pairs: "()[]{}\"\"" },
      lineComment: ";",
      blockCommentStart: "#|",
      blockCommentEnd: "|#"
    };
  });
});
