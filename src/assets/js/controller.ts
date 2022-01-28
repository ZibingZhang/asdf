/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  RImage,
  isRImage
} from "../../interpreter/modules/htdp/image/rvalue";
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

const enum Tab {
  Editor,
  Settings,
  Info
}

class Controller {
  editor: Editor;
  settings: Settings;
  info: Info;
  repl: Repl;
  testOutput: TestOutput;

  activeTab = Tab.Editor;
  tabs: Map<Tab, [HTMLElement, any]> = new Map();

  constructor() {
    this.editor = new Editor("editor-textarea");
    this.settings = new Settings("settings-textarea");
    this.info = new Info("info-textarea");
    this.repl = new Repl("repl-textarea");
    this.testOutput = new TestOutput("test-output-textarea");

    this.editor.registerController(this);
    this.tabs.set(Tab.Editor, [<HTMLElement>document.getElementById("editor-tab"), this.editor]);
    this.tabs.set(Tab.Settings, [<HTMLElement>document.getElementById("settings-tab"), this.settings]);
    this.tabs.set(Tab.Info, [<HTMLElement>document.getElementById("info-tab"), this.info]);

    this.editor.cm.focus();
    this.settings.updateSettings();

    document.getElementById("run-button")!.onclick = this.editor.runCode;
    document.getElementById("editor-button")!.onclick = () => this.switchToTab(Tab.Editor);
    document.getElementById("settings-button")!.onclick = () => this.switchToTab(Tab.Settings);
    document.getElementById("info-button")!.onclick = () => this.switchToTab(Tab.Info);

    window.racket.pipeline.setSuccessCallback(output => {
      const waitingImages: RImage[] = [];
      for (const rval of output) {
        if (isRImage(rval)) {
          waitingImages.push(rval);
        } else {
          this.repl.append(rval.stringify() + "\n");
          while (waitingImages.length > 0) {
            const image = waitingImages.shift()!;
            this.repl.cm.addLineWidget(
              this.repl.cm.lastLine() - 1,
              image.canvas,
              { above: true }
            );
          }
        }
      }
      while (waitingImages.length > 0) {
        const image = waitingImages.shift()!;
        this.repl.cm.addLineWidget(
          this.repl.cm.lastLine(),
          image.canvas,
          { above: true }
        );
      }
      this.repl.append("> ");
      this.repl.cm.scrollIntoView(this.repl.cm.lastLine());
    });
    window.racket.pipeline.setTestResultsCallback(this.testOutput.handleTestResults.bind(this.testOutput));
  }

  switchToTab(nextTab: Tab) {
    if (this.activeTab === Tab.Settings && nextTab !== Tab.Settings) {
      if (!this.settings.updateSettings()) {
        return;
      }
    }
    for (const [tab, [element, cmWrapper]] of this.tabs.entries()) {
      if (tab !== nextTab) {
        element.style.display = "none";
      } else {
        element.style.removeProperty("display");
        cmWrapper.cm.refresh();
        cmWrapper.cm.focus();
      }
    }
    this.activeTab = nextTab;
  }
}
