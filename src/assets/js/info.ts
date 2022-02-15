/* eslint-disable @typescript-eslint/no-explicit-any */
export {
  Info
};

declare let CodeMirror: CodeMirror;

class Info {
  private INIT_VALUE = `Source code at https://github.com/ZibingZhang/racket-online-ide

Keyboard shortcuts
==================

Editor
--------------------
Alt-Enter | Run code

Settings
-----------------------------------------
Ctrl-s | Save settings`;

  cm: CodeMirror;

  constructor(elementId: string) {
    const textArea = <HTMLElement>document.getElementById(elementId);
    this.cm = CodeMirror(
      (elt: HTMLElement) => {
        textArea.parentNode?.replaceChild(elt, textArea);
      }, {
        lineNumbers: false,
        readOnly: true,
        value: this.INIT_VALUE,
        mode: "text"
      }
    );
  }
}
