import {
  RPPAbove,
  RPPBeside
} from "./primitive/overlayingImages";
import {
  RPC_EMPTY_IMAGE,
  RPPCircle,
  RPPEllipse
} from "./primitive/basicImages";
import {
  RModule
} from "../../../rvalue";
import {
  RPPRectangle
} from "./primitive/polygons";

export {
  R2HtdpImageModule
};

class R2HtdpImageModule extends RModule {
  constructor() {
    super(
      "2htdp/image",
      [
        ["color", ["red", "green", "blue"]]
      ],
      [
        // basic images
        new RPPCircle(),
        new RPPEllipse(),

        // polygons
        new RPPRectangle(),

        // overlaying images
        new RPPBeside(),
        new RPPAbove()
      ],
      new Map([
        ["empty-image", RPC_EMPTY_IMAGE]
      ])
    );
  }
}
