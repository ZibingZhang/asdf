"use strict";(self.webpackChunkracket_online_ide=self.webpackChunkracket_online_ide||[]).push([[528],{512:(e,n,t)=>{t(985)},985:()=>{const e={exprCounter:0,specialIndent:null,specialIndentName:null,firstChildSExprCol:null,secondChildSExprCol:null};var n;!function(e){e.BRACKET="bracket",e.BOOLEAN="boolean",e.CHARACTER="character",e.COMMENT="comment",e.ERROR="error",e.KEYWORD="keyword",e.NAME="name",e.NUMBER="number",e.PLACEHOLDER="placeholder",e.STRING="string"}(n||(n={}));const t=new Set([n.BOOLEAN,n.CHARACTER,n.ERROR,n.KEYWORD,n.NAME,n.NUMBER,n.PLACEHOLDER,n.STRING]);!function(r){r.defineMode("racket",(function(r){const c=/^[^\s"'([{)\]};`,]*/,i=/^(T|t|true|F|f|false)$/,o=/^[+-]?(\.\d+|\d+(\.\d*|\/\d+)?)$/,l=/^[ei][+-]?(\.\d+|\d+(\.\d*|\/\d+)?)$/,s=/^(and|check-error|check-expect|check-member-of|check-random|check-range|check-satisfied|check-within|cond|define|define-struct|else|if|lambda|letrec|let\*|let|local|or|quasiquote|quote|require|unquote)$/,u=/^(nul|null|backspace|tab|newline|linefeed|vtab|page|return|space|rubout)$/,p=/^\.{2,6}$/,a=new Map([["(",")"],["[","]"],["{","}"]]);function d(e,n){null!==e.sexpr&&(null===e.sexpr.firstChildSExprCol?e.sexpr.firstChildSExprCol=n:null===e.sexpr.secondChildSExprCol&&(e.sexpr.secondChildSExprCol=n))}function E(e,r,c){return r&&e.expectingQuoted&&t.has(r)?e.expectingQuoted=!1:null!==e.sexpr&&!1!==c&&(e.sexpr.exprCounter++,r!==n.BRACKET&&d(e,c)),e.sexpr&&e.sexpr.isCommented?n.COMMENT:e.sexprComment>0?(e.sexprComment--,n.COMMENT):r}function x(t,r){if(t.eatSpace())return null;let x=t.next(),f=t.column();if("([{".includes(x))return r.expectingQuoted?r.expectingQuoted=!1:d(r,f),r.sexpr={ch:x,col:f,parent:r.sexpr,isCommented:r.sexprComment>0,...e},E(r,n.BRACKET,f);if(")]}".includes(x)){if(null===r.sexpr)return E(r,n.ERROR,f);{let e=r.sexpr.ch;return r.sexpr=r.sexpr.parent,x===a.get(e)?E(r,n.BRACKET,f):E(r,n.ERROR,f)}}if(";"===x)return t.skipToEnd(),n.COMMENT;if(x.match(/^['`,]/)){let e=E(r,n.KEYWORD,f);return r.expectingQuoted=!0,e}if('"'===x)return r.tokenize=R,E(r,n.STRING,f);if("#"===x){if(t.eol()||t.peek().match(/^\s/))return E(r,n.ERROR,f);if(t.match(/^![/ ]/))return t.skipToEnd(),n.COMMENT;if(x=t.next(),";"===x)return r.sexprComment++,n.COMMENT;if("|"===x)return r.tokenize=C(0),r.tokenize(t,r);if("\\"===x){if(t.eol())return void 0===t.lookAhead(1)?E(r,n.ERROR,f):E(r,n.CHARACTER,f);if(x=t.next(),!x.match(/[a-z]/i))return E(r,n.CHARACTER,f);const e=x+t.match(/[a-z]*/)[0];return 1===e.length||e.match(u)?E(r,n.CHARACTER,f):E(r,n.ERROR,f)}const e=x+t.match(c)[0];return e.match(i)?E(r,n.BOOLEAN,f):e.match(l)?E(r,n.NUMBER,f):E(r,n.ERROR,f)}const h=x+t.match(c);if(h.match(s)){if(r.sexpr)switch(h){case"cond":case"define":case"let":r.sexpr.specialIndent=2,r.sexpr.specialIndentName=h}return E(r,n.KEYWORD,f)}return h.match(o)?E(r,n.NUMBER,f):h.match(p)?E(r,n.PLACEHOLDER,f):E(r,n.NAME,f)}function C(e){return function(t,r){const c=t.match(/^.*?(#\||\|#)/);return c?"#|"==c[1]?r.tokenize=C(e+1):r.tokenize=e>0?C(e-1):x:t.skipToEnd(),n.COMMENT}}function R(e,t){if(e.eatSpace())return n.STRING;for(;!e.eol();)if(!e.match('\\"')&&'"'===e.next())return t.tokenize=x,E(t,n.STRING,!1);return E(t,n.STRING,!1)}return{startState:function(){return{tokenize:x,sexpr:null,sexprComment:0,expectingQuoted:!1}},token:function(e,n){return n.tokenize(e,n)},indent:function(e,n){return null===e.sexpr?0:e.sexpr.specialIndent?"let"===e.sexpr.specialIndentName&&null===e.sexpr.secondChildSExprCol?(e.sexpr.firstChildSExprCol||0)+3:e.sexpr.specialIndent:e.sexpr.secondChildSExprCol||e.sexpr.firstChildSExprCol||e.sexpr.col+1}}}))}(CodeMirror)}},e=>{e(e.s=512)}]);