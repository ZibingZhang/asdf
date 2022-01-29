import {
  RModule,
  RStructType
} from "../../../rvalue";
import {
  RPPCircle,
  RPPRectangle
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
        new RPPCircle(),
        new RPPRectangle()
      ]
    );
  }
}
