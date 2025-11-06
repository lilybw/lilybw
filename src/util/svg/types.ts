import { JSX } from "solid-js/jsx-runtime";
import { Path } from "./entrypoint";
import { _DirectiveSymbols, DirectiveSymbol } from "./symbol";
import { mirrorCustomVec2 } from "./svgUtil";

export interface SVGOptions {
    attributes?: JSX.SvgSVGAttributes<SVGSVGElement>;
    children?: JSX.Element;
}

export interface PathOptions<T extends PredefinedResources = {}> {
    attributes: JSX.PathSVGAttributes<SVGPathElement>;
    resources?: T;
    modifiers?: PathModifier<T> | PathModifier<T>[];
};

export interface DD2<T extends PredefinedResources = {}> {
    toPathString(): string;
    /* Nearest possible approximation of a point repressentation of the draw directive.
    In case of curves, this should include control points as well. */
    getPoints(): vec2<number>[];
    getSymbol(): DirectiveSymbol;
    getMirroredOnX(): DD2<T>;
    getMirroredOnY(): DD2<T>;
    getMirroredCustom(axisOffset: vec2<number>, angleRad: number): DD2<T>; 
    applyConstantOffset(offset: vec2<number>): DD2<T>; // Add this
}

export class DD2CE<T extends PredefinedResources = {}> implements DD2<T> {
    toPathString(): string { return _DirectiveSymbols.End; }
    getPoints(): vec2<number>[] { return []; }
    getSymbol(): DirectiveSymbol { return _DirectiveSymbols.End; }
    getMirroredOnX(): DD2CE<T> { return new DD2CE(); }
    getMirroredOnY(): DD2CE<T> { return new DD2CE(); }
    getMirroredCustom(axisOffset: vec2<number>, angleRad: number): DD2CE<T> { return new DD2CE() }
    applyConstantOffset(offset: vec2<number>): DD2CE<T> { 
        return new DD2CE(); 
    }
}

export class DD2CCurve<T extends PredefinedResources = {}> implements DD2<T> {
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
    getMirroredOnX(): DD2CCurve<T> { return new DD2CCurve(
        this.x1, 
        -this.y1,
        this.x2, 
        -this.y2,
        this.x, 
        -this.y
    ); }
    getMirroredOnY(): DD2CCurve<T> { return new DD2CCurve(
        -this.x1, 
        this.y1,
        -this.x2, 
        this.y2,
        -this.x, 
        this.y
    ); }
    getMirroredCustom(axisOffset: vec2<number>, angleRad: number): DD2CCurve<T> { 
        throw new Error("DD2CCurve#getMirroredCustom NOT IMPLIMENTED") 
    }
    applyConstantOffset(offset: vec2<number>): DD2CCurve<T> { 
        return new DD2CCurve(
            this.x1 + offset[0], 
            this.y1 + offset[1],
            this.x2 + offset[0], 
            this.y2 + offset[1],
            this.x + offset[0], 
            this.y + offset[1]
        );
    }
}
export class DD2CArc<T extends PredefinedResources = {}> implements DD2<T> {
    constructor(
        public readonly rx: number,
        public readonly ry: number,
        public readonly rotation: number,
        public readonly largeArc: boolean, 
        public readonly sweep: boolean, 
        public readonly x: number, 
        public readonly y: number
    ) {}
    toPathString(): string { return _DirectiveSymbols.ArcTo; }
    getPoints(): vec2<number>[] { return [
        [ this.x, this.y ],
        [ this.x + this.rx, this.y + this.ry ],
        [ this.x - this.rx, this.y - this.ry ]
    ]; }
    getSymbol(): DirectiveSymbol { return _DirectiveSymbols.ArcTo; }
    getMirroredOnX(): DD2CArc<T> { return new DD2CArc(
        this.rx, 
        this.ry,
        -this.rotation,
        this.largeArc,
        !this.sweep, 
        this.x, 
        -this.y
    ); }
    getMirroredOnY(): DD2CArc<T> { return new DD2CArc(
        this.rx, 
        this.ry,
        -this.rotation,
        this.largeArc,
        !this.sweep, 
        -this.x, 
        this.y
    ); }
    getMirroredCustom(axisOffset: vec2<number>, angleRad: number): DD2CArc<T> {
        throw new Error("DD2CCurve#getMirroredCustom NOT IMPLIMENTED") 
    }
    applyConstantOffset(offset: vec2<number>): DD2CArc<T> {
        return new DD2CArc(
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

export class DD2CVec2<T extends PredefinedResources = {}> implements DD2<T> {
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

    getMirroredOnX(): DD2CVec2<T> {
        return new DD2CVec2(this.symbol, [this.point[0], -this.point[1]]);
    }

    getMirroredOnY(): DD2CVec2<T> {
        return new DD2CVec2(this.symbol, [-this.point[0], this.point[1]]);
    }

    getMirroredCustom(axisOffset: vec2<number>, angleRad: number): DD2CVec2<T> {
        return new DD2CVec2(this.symbol, mirrorCustomVec2(this.point, axisOffset, angleRad))
    }
    applyConstantOffset(offset: vec2<number>): DD2CVec2<T> {
        return new DD2CVec2(
            this.symbol, 
            [this.point[0] + offset[0], this.point[1] + offset[1]]
        );
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
