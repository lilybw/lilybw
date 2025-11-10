import { JSX } from "solid-js/jsx-runtime";
import { InternalResource, PredefinedResources, ReferencableResource } from "./types";
import { Path } from "./entrypoint";
import { formatSVGElementID } from "./svgUtil";
import { getNextHash } from "../hashUtil";

export class ClipPath implements InternalResource, ReferencableResource {
    private name: string = 'unnamed-clip-path-' + getNextHash();
    
    constructor(
        private readonly path: Path<any>,
    ) {}

    getURL(): string {
        return this.name;
    }

    setName(name: string): void {
        this.name = name;
    }

    toJSXElement(svgId: string, defs?: PredefinedResources): JSX.Element {
        return (
            <clipPath id={formatSVGElementID(svgId, this.name)}>
                {this.path.toJSXElement(svgId, defs)}
            </clipPath>
        );
    }
}

