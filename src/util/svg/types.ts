import { JSX } from "solid-js/jsx-runtime";
import { Path } from "./entrypoint";
import { _DirectiveSymbols, DirectiveSymbol } from "./symbol";
import { mirrorCustomVec2 } from "./svgUtil";

export interface SVGOptions<T extends PredefinedResources = {}> {
    htmlAttributes?: JSX.SvgSVGAttributes<SVGSVGElement>;
    children?: JSX.Element;
    defs?: T;
}

/** For any key of T, add R as an accepted type for said key */
export type ExpandAllValueTypes<T,R> = {
    [K in keyof T]: T[K] | R;
}

export type ExtendedSVGPathAttributes = ExpandAllValueTypes<JSX.PathSVGAttributes<SVGPathElement>, ReferencableResource>;

export interface PathOptions<T extends PredefinedResources = {}> {
    htmlAttributes?: SelfOrSupplier<ExtendedSVGPathAttributes, T>;
    modifiers?: PathModifier<T> | PathModifier<T>[];
};

export interface DrawDirective<T extends PredefinedResources = {}> {
    toPathString(): string;
    /* Nearest possible approximation of a point repressentation of the draw directive.
    In case of curves, this should include control points as well. */
    getPoints(): vec2<number>[];
    getSymbol(): DirectiveSymbol;
    getMirroredOnX(): DrawDirective<T>;
    getMirroredOnY(): DrawDirective<T>;
    getMirroredCustom(axisOffset: vec2<number>, angleRad: number): DrawDirective<T>; 
    applyConstantOffset(offset: vec2<number>): DrawDirective<T>; // Add this
}
export class DDEndOfPath<T extends PredefinedResources = {}> implements DrawDirective<T> {
    toPathString(): string { return _DirectiveSymbols.End; }
    getPoints(): vec2<number>[] { return []; }
    getSymbol(): DirectiveSymbol { return _DirectiveSymbols.End; }
    getMirroredOnX(): DDEndOfPath<T> { return new DDEndOfPath(); }
    getMirroredOnY(): DDEndOfPath<T> { return new DDEndOfPath(); }
    getMirroredCustom(axisOffset: vec2<number>, angleRad: number): DDEndOfPath<T> { return new DDEndOfPath() }
    applyConstantOffset(offset: vec2<number>): DDEndOfPath<T> { 
        return new DDEndOfPath(); 
    }
}
export class DrawDirectiveCurve<T extends PredefinedResources = {}> implements DrawDirective<T> {
    constructor(
        public readonly x1: number, 
        public readonly y1: number, 
        public readonly x2: number, 
        public readonly y2: number,
        public readonly x: number, 
        public readonly y: number
    ) {}
    toPathString(): string { return `${_DirectiveSymbols.CurveTo} ${this.x1} ${this.y1}, ${this.x2} ${this.y2}, ${this.x} ${this.y}`; }
    getPoints(): vec2<number>[] { return [
        [ this.x1, this.y1 ],
        [ this.x2, this.y2 ],
        [ this.x, this.y ]
    ]; }
    getSymbol(): DirectiveSymbol { return _DirectiveSymbols.CurveTo; }
    getMirroredOnX(): DrawDirectiveCurve<T> { return new DrawDirectiveCurve(
        this.x1, 
        -this.y1,
        this.x2, 
        -this.y2,
        this.x, 
        -this.y
    ); }
    getMirroredOnY(): DrawDirectiveCurve<T> { return new DrawDirectiveCurve(
        -this.x1, 
        this.y1,
        -this.x2, 
        this.y2,
        -this.x, 
        this.y
    ); }
    getMirroredCustom(axisOffset: vec2<number>, angleRad: number): DrawDirectiveCurve<T> { 
        throw new Error("DD2CCurve#getMirroredCustom NOT IMPLIMENTED") 
    }
    applyConstantOffset(offset: vec2<number>): DrawDirectiveCurve<T> { 
        return new DrawDirectiveCurve(
            this.x1 + offset[0], 
            this.y1 + offset[1],
            this.x2 + offset[0], 
            this.y2 + offset[1],
            this.x + offset[0], 
            this.y + offset[1]
        );
    }
}
export class DrawDirectiveArc<T extends PredefinedResources = {}> implements DrawDirective<T> {
    constructor(
        public readonly rx: number,
        public readonly ry: number,
        public readonly rotation: number,
        public readonly largeArc: boolean, 
        public readonly sweep: boolean, 
        public readonly x: number, 
        public readonly y: number
    ) {}
    toPathString(): string { 
        return `${_DirectiveSymbols.ArcTo} ${this.rx} ${this.ry} ${this.rotation} ${this.largeArc ? "1" : "0"} ${this.sweep ? "1" : "0"} ${this.x} ${this.y}`; 
    }
    getPoints(): vec2<number>[] { return [
        [ this.x, this.y ],
        [ this.x + this.rx, this.y + this.ry ],
        [ this.x - this.rx, this.y - this.ry ]
    ]; }
    getSymbol(): DirectiveSymbol { return _DirectiveSymbols.ArcTo; }
    getMirroredOnX(): DrawDirectiveArc<T> { return new DrawDirectiveArc(
        this.rx, 
        this.ry,
        -this.rotation,
        this.largeArc,
        !this.sweep, 
        this.x, 
        -this.y
    ); }
    getMirroredOnY(): DrawDirectiveArc<T> { return new DrawDirectiveArc(
        this.rx, 
        this.ry,
        -this.rotation,
        this.largeArc,
        !this.sweep, 
        -this.x, 
        this.y
    ); }
    getMirroredCustom(axisOffset: vec2<number>, angleRad: number): DrawDirectiveArc<T> {
        throw new Error("DD2CCurve#getMirroredCustom NOT IMPLIMENTED") 
    }
    applyConstantOffset(offset: vec2<number>): DrawDirectiveArc<T> {
        return new DrawDirectiveArc(
            this.rx, 
            this.ry,
            this.rotation,
            this.largeArc,
            this.sweep, 
            this.x + offset[0], 
            this.y + offset[1]
        );
    }
}
export class DrawDirectiveVec2<T extends PredefinedResources = {}> implements DrawDirective<T> {
    constructor(
        private readonly symbol: DirectiveSymbol,
        private readonly point: vec2<number>,
    ) { }

    toPathString(): string {
        return `${this.symbol} ${this.point[0]} ${this.point[1]}`
    }

    getPoints(): vec2<number>[] {
        return [this.point];
    }

    getSymbol(): DirectiveSymbol {
        return this.symbol;
    }

    getMirroredOnX(): DrawDirectiveVec2<T> {
        return new DrawDirectiveVec2(this.symbol, [this.point[0], -this.point[1]]);
    }

    getMirroredOnY(): DrawDirectiveVec2<T> {
        return new DrawDirectiveVec2(this.symbol, [-this.point[0], this.point[1]]);
    }

    getMirroredCustom(axisOffset: vec2<number>, angleRad: number): DrawDirectiveVec2<T> {
        return new DrawDirectiveVec2(this.symbol, mirrorCustomVec2(this.point, axisOffset, angleRad))
    }
    applyConstantOffset(offset: vec2<number>): DrawDirectiveVec2<T> {
        return new DrawDirectiveVec2(
            this.symbol, 
            [this.point[0] + offset[0], this.point[1] + offset[1]]
        );
    }
}

export type DrawDirectiveSupplier<T extends PredefinedResources = {}> = 
    | DrawDirective<T>[]
    | ((resources: T) => DrawDirective<T>[]);

export interface PathBounds {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
}

export interface Resource {
    toJSXElement(svgId: string): JSX.Element;
}; 
export interface InternalResource extends Resource {
    /* Only for internal use */
    setName(name: string): void;
}
export type ResourceSupplier = (/* params tbd */) => Resource; 
export interface ReferencableResource extends Resource { //linearGradient, radialGradient, pattern, clipPath, mask
    getURL(): string;
}
export type PredefinedResources = { [key: string]: InternalResource; }; //Any object containing only Resource types under any name


export type PathModifier<T extends PredefinedResources = {}> = (existingDirectives: DrawDirective<T>[]) => DrawDirective<T>[];

export type vec2<T> = [T, T];
export type vec3<T> = [T, T, T];
export type vec4<T> = [T, T, T, T];
export type int32 = number;
export type uint32 = number;
export type float32 = number;

type SelfOrSupplier<T,K> = T | ((res: K) => T);
export type DirectiveOrSupplier<T extends PredefinedResources = {}> = SelfOrSupplier<DrawDirective<T>, T>;
export type OptionsPathTuple<T extends PredefinedResources = {}> = [DirectiveOrSupplier<T>[], PathOptions<T>?];

// Recursive type that builds: [directives[], options?, directives[], options?, ...]
export type FlattenedArgs<T extends readonly PredefinedResources[]> = 
    T extends readonly [infer First extends PredefinedResources, ...infer Rest extends readonly PredefinedResources[]]
        ? [DirectiveOrSupplier<First>[], PathOptions<First>?, ...FlattenedArgs<Rest>]
        : [];

export const normalizeVector2 = (vec: vec2<number>): vec2<number> => {
    const mag = Math.sqrt( Number(vec[0]) * Number(vec[0]) + Number(vec[1]) * Number(vec[1]) );
    if (mag === 0) {
        return [0, 0];
    }
    return [ vec[0] / mag, vec[1] / mag ];
}
export const normalizeVector3 = (vec: vec3<number>): vec3<number> => {
    const mag = Math.sqrt( Number(vec[0]) * Number(vec[0]) + Number(vec[1]) * Number(vec[1]) + Number(vec[2]) * Number(vec[2]) );
    if (mag === 0) {
        return [0, 0, 0];
    }
    return [ vec[0] / mag, vec[1] / mag, vec[2] / mag ];
}
export const normalizeVector4 = (vec: vec4<number>): vec4<number> => {
    const mag = Math.sqrt( Number(vec[0]) * Number(vec[0]) + Number(vec[1]) * Number(vec[1]) + Number(vec[2]) * Number(vec[2]) + Number(vec[3]) * Number(vec[3]) );
    if (mag === 0) {
        return [0, 0, 0, 0];
    }
    return [ vec[0] / mag, vec[1] / mag, vec[2] / mag, vec[3] / mag ];
}

