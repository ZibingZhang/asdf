/* eslint-disable @typescript-eslint/no-non-null-assertion */
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

  activeTab = "editor";
  editorTab: HTMLElement;
  settingsTab: HTMLElement;
  infoTab: HTMLElement;

  constructor() {
    this.editor = new Editor("editor-textarea");
    this.settings = new Settings("settings-textarea");
    this.info = new Info("info-textarea");
    this.repl = new Repl("repl-textarea");
    this.testOutput = new TestOutput("test-output-textarea");

    this.editor.registerController(this);
    this.editorTab = <HTMLElement>document.getElementById("editor-tab");
    this.settingsTab = <HTMLElement>document.getElementById("settings-tab");
    this.infoTab = <HTMLElement>document.getElementById("info-tab");

    this.editor.cm.focus();
    this.settings.updateSettings();

    document.getElementById("run-button")!.onclick = this.editor.runCode;
    document.getElementById("editor-button")!.onclick = this.switchToEditor;
    document.getElementById("settings-button")!.onclick = this.switchToSettings;
    document.getElementById("info-button")!.onclick = this.switchToInfo;

    window.racket.pipeline.setSuccessCallback(output => {
      let replOutput = "";
      for (const text of output) {
        replOutput += text + "\n";
      }
      replOutput += "> ";
      this.repl.appendToRepl(replOutput);
    });
    window.racket.pipeline.setTestResultsCallback(this.testOutput.handleTestResults);
  }

  switchToEditor() {
    if (this.activeTab === "settings") { if (!this.settings.updateSettings()) { return; } }
    this.settingsTab.style.display = "none";
    this.infoTab.style.display = "none";
    this.editorTab.style.removeProperty("display");
    this.editor.cm.refresh();
    this.editor.cm.focus();
    this.activeTab = "editor";
  }

  switchToSettings() {
    this.editorTab.style.display = "none";
    this.infoTab.style.display = "none";
    this.settingsTab.style.removeProperty("display");
    this.settings.cm.refresh();
    this.settings.cm.focus();
    this.activeTab = "settings";
  }

  switchToInfo() {
    if (this.activeTab === "settings") { if (!this.settings.updateSettings()) { return; } }
    this.editorTab.style.display = "none";
    this.settingsTab.style.display = "none";
    this.infoTab.style.removeProperty("display");
    this.info.cm.refresh();
    this.activeTab = "info";
  }
}
