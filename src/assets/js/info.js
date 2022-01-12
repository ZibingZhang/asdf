export {
  INFO
};

const initValue =
`Source code at https://github.com/ZibingZhang/racket-online-ide

Keyboard shortcuts
==================

Editor
--------------------
Alt-Enter | Run code

Settings
-----------------------------------------
Ctrl-s | Save settings; Return to editor`;

const infoTextArea = document.getElementById("info-textarea");
const INFO = CodeMirror(
  (elt) => {
    infoTextArea.parentNode.replaceChild(elt, infoTextArea);
  }, {
    lineNumbers: false,
    readOnly: true,
    value: initValue,
    mode: "text"
  }
);
