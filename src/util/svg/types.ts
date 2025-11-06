import { JSX } from "solid-js/jsx-runtime";
import { Path } from "./entrypoint";
export type DrawDirective<T extends PredefinedResources = {}> = 
    | { type: 'M'; x: number; y: number }
    | { type: 'L'; x: number; y: number }
    | { type: 'C'; x1: number; y1: number; x2: number; y2: number; x: number; y: number }
    | { type: 'A'; rx: number; ry: number; rotation: number; largeArc: boolean; sweep: boolean; x: number; y: number }
    | { type: 'E' };

    // (res: T) => DrawDirective<T>[];

export interface SVGOptions {
    attributes?: JSX.SvgSVGAttributes<SVGSVGElement>;
    children?: JSX.Element;
}

export interface PathOptions<T extends PredefinedResources = {}> {
    attributes: JSX.PathSVGAttributes<SVGPathElement>;
    resources?: T;
    modifiers?: PathModifier<T> | PathModifier<T>[];
};

export type SVGSymbol = keyof typeof Path.Symbol;

export interface DD2<T extends PredefinedResources = {}> {
    toPathString(): string;
    /* Nearest possible approximation of a point repressentation of the draw directive.
    In case of curves, this should include control points as well. */
    getPoint(): vec2<number>[];
    getSymbol(): SVGSymbol;
}

export class DD2C<T extends PredefinedResources = {}> implements DD2<T> {
    constructor(private directive: DD2<T>) {
        
    }

    toPathString(): string {
        return this.directive.toPathString();
    }

    getPoint(): vec2<number>[] {
        return this.directive.getPoint();
    }

    getSymbol(): SVGSymbol {
        return this.directive.getSymbol();
    }
}

export type DrawDirectiveSupplier<T extends PredefinedResources = {}> = 
    | DD2<T>[]
    | ((resources: T) => DD2<T>[]);

export interface PathBounds {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
}

export interface Resource {}; 
export type ResourceSupplier = (/* params tbd */) => Resource; 
export interface ReferencableRessource extends Resource { //linearGradient, radialGradient, pattern, clipPath, mask
    getURL(): string;
}
export type PredefinedResources = { [key: string]: Resource; }; //Any object containing only Resource types under any name


export type PathModifier<T extends PredefinedResources = {}> = (existingDirectives: DD2<T>[]) => DD2<T>[];

export type vec2<T> = [T, T];
export type vec3<T> = [T, T, T];
export type int32 = number;
export type uint32 = number;
export type float32 = number;
