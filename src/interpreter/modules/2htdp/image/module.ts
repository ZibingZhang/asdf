import {
  RPC_EMPTY_IMAGE,
  RPPCircle,
  RPPEllipse
} from "./primitive/basicImages";
import {
  RPPAbove,
  RPPBeside
} from "./primitive/overlayingImages";
import {
  RPPImageHeight,
  RPPImageWidth
} from "./primitive/imageProperties";
import {
  RPPRectangle,
  RPPSquare
} from "./primitive/polygons";
import {
  RModule
} from "../../../rvalue";
import {
  RPPImageHuh
} from "./primitive/imagePredicates";

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
        new RPPSquare(),
        new RPPRectangle(),

        // overlaying images
        new RPPBeside(),
        new RPPAbove(),

        // image properties
        new RPPImageWidth(),
        new RPPImageHeight(),

        // image predicates
        new RPPImageHuh()
      ],
      new Map([
        ["empty-image", RPC_EMPTY_IMAGE]
      ])
    );
  }
}
