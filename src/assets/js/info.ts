export {
  Info
};

declare var CodeMirror: any;

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

  cm: any;

  constructor(elementId: string) {
    const textArea = document.getElementById(elementId) || new Element();
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
