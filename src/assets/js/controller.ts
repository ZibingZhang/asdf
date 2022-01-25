import {
  Editor
} from "./editor";
import {
  Info
} from "./info";
import {
  Repl
} from "./repl";
import {
  Settings
} from "./settings";
import {
  TestOutput
} from "./test-output";

export {
  Controller
};

class Controller {
  editor: Editor;
  settings: Settings;
  info: Info;
  repl: Repl;
  testOutput: TestOutput;

  constructor() {
    this.editor = new Editor("editor-textarea");
    this.settings = new Settings("settings-textarea");
    this.info = new Info("info-textarea");
    this.repl = new Repl("repl-textarea");
    this.testOutput = new TestOutput("test-output-textarea");

    this.editor.registerController(this);

    this.editor.cm.focus();
    this.settings.updateSettings();

    window.racket.pipeline.setSuccessCallback(output => {
      let replOutput = "";
      for (const text of output) {
        replOutput += text + "\n";
      }
      replOutput += "> ";
      this.repl.appendToRepl(replOutput);
    });
  }
}
