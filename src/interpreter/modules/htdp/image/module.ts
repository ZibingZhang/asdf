import {
  RModule,
  RStructType
} from "../../../rvalue";
import {
  RPFRectangle
} from "./primitive";

export {
  RModuleHtdpImage
};

class RModuleHtdpImage extends RModule {
  constructor() {
    super(
      [
        ["color", ["red", "green", "blue"]]
      ],
      [
        new RPFRectangle()
      ]
    );
  }
}
