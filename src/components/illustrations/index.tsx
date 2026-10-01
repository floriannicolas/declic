import type { IllustrationId } from "@/types";
import { BokehIllustration } from "./bokeh-illustration";
import {
  ApertureIllustration,
  CompensationIllustration,
  IsoIllustration,
  ShutterIllustration,
  StopsIllustration,
  TriangleIllustration,
} from "./exposure-illustrations";
import { AfMotorIllustration, AutofocusIllustration, DepthOfFieldIllustration, MeteringIllustration } from "./focus-illustrations";
import {
  ExposureModesIllustration,
  FocalLengthIllustration,
  PanningIllustration,
  SensorIllustration,
  StabilizationIllustration,
} from "./gear-illustrations";

/** Every IllustrationId must have a component: TypeScript enforces it here. */
export const ILLUSTRATIONS: Record<IllustrationId, () => React.ReactNode> = {
  aperture: ApertureIllustration,
  shutter: ShutterIllustration,
  iso: IsoIllustration,
  triangle: TriangleIllustration,
  stops: StopsIllustration,
  "depth-of-field": DepthOfFieldIllustration,
  bokeh: BokehIllustration,
  metering: MeteringIllustration,
  autofocus: AutofocusIllustration,
  "af-motor": AfMotorIllustration,
  stabilization: StabilizationIllustration,
  compensation: CompensationIllustration,
  panning: PanningIllustration,
  sensor: SensorIllustration,
  "focal-length": FocalLengthIllustration,
  "exposure-modes": ExposureModesIllustration,
};
