import { JSX } from "solid-js/jsx-runtime";
import { InternalResource, ReferencableResource } from "./types";

export class Image implements InternalResource, ReferencableResource {
  private name: string = "unnamed-svg-image";
  constructor(public readonly href: string) {}

  setName(name: string): void {
    this.name = name;
  }
  toJSXElement(svgId: string): JSX.Element {
    return <image href={this.href} />;
  }
  getURL(): string {
    return this.name;
  }
}
