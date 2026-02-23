import { JSX } from "solid-js/jsx-runtime";
import {
  DirectiveOrSupplier,
  DrawDirective,
  GuaranteedResources,
  InternalResource,
  PathOptions,
  PredefinedResources,
  ReferencableResource,
} from "./types";
import { Path } from "./entrypoint";
import {
  formatSVGElementID,
  normalizeEntrypointArgs,
  normalizePathOptions,
} from "./svgUtil";
import { getNextHash } from "../hashUtil";

export class ClipPath<T extends PredefinedResources = GuaranteedResources>
  implements InternalResource, ReferencableResource
{
  private name: string = "unnamed-clip-path-" + getNextHash();
  private readonly path: Path<T>;

  constructor(
    directives: (DrawDirective<T> | DrawDirective<T>[])[],
    options?: PathOptions<T>,
  ) {
    const resolvedOptions = normalizePathOptions(options);
    const flattedDirectives = directives.flatMap((e) => e);

    this.path = new Path(flattedDirectives, resolvedOptions.htmlAttributes);
  }

  getPath(): Path<T> {
    return this.path;
  }

  getURL(): string {
    return this.name;
  }

  setName(name: string): void {
    this.name = name;
  }

  toJSXElement(svgId: string, defs: PredefinedResources): JSX.Element {
    return (
      <clipPath id={formatSVGElementID(svgId, this.name)}>
        {this.path.toJSXElement(svgId, defs)}
      </clipPath>
    );
  }
}
