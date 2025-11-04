import { Component, JSX } from "solid-js";

export type DrawDirective<T extends PredefinedResources = {}> = 
    | { type: 'M'; x: number; y: number }
    | { type: 'L'; x: number; y: number }
    | { type: 'C'; x1: number; y1: number; x2: number; y2: number; x: number; y: number }
    | { type: 'A'; rx: number; ry: number; rotation: number; largeArc: boolean; sweep: boolean; x: number; y: number }
    | { type: 'E' };

    // (res: T) => DrawDirective<T>[];

export type DrawDirectiveSupplier<T extends PredefinedResources = {}> = 
    | DD2<T>[]
    | ((resources: T) => DD2<T>[]);

export interface DD2<T extends PredefinedResources = {}> {
    toString(): string;
    /* Nearest possible approximation of a point repressentation of the draw directive.
    In case of curves, this should include control points as well. */
    getPoint(): vec2<number>[];
}

interface PathBounds {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
}


/**
 * Extract all points from draw directives for bounds calculation
 */
function extractPoints(directives: DrawDirective[]): vec2<number>[] {
    const points: vec2<number>[] = [];

    for (const dir of directives) {
        switch (dir.type) {
            case 'M':
            case 'L':
                points.push([ dir.x, dir.y ]);
                break;
            case 'C':
                points.push(
                    [ dir.x1, dir.y1 ],
                    [ dir.x2, dir.y2 ],
                    [ dir.x, dir.y ]
                );
                break;
            case 'A':
                points.push([ dir.x, dir.y ]);
                // For arcs, we approximate by including the radii as potential bounds
                points.push(
                    [ dir.x + dir.rx, dir.y + dir.ry ],
                    [ dir.x - dir.rx, dir.y - dir.ry ]
                );
                break;
        }
    }
    
    return points;
}

/**
 * Calculate bounds of points
 */
function getBounds(points: vec2<number>[]): PathBounds {
    if (points.length === 0) {
        return { minX: -1, maxX: 1, minY: -1, maxY: 1 };
    }

    return points.reduce(
        (bounds, p) => ({
            minX: Math.min(bounds.minX, p[0]),
            maxX: Math.max(bounds.maxX, p[0]),
            minY: Math.min(bounds.minY, p[1]),
            maxY: Math.max(bounds.maxY, p[1]),
        }),
        { minX: points[0][0], maxX: points[0][0], minY: points[0][1], maxY: points[0][1] }
    );
}

/**
 * Mirror directives around Y-axis
 */
function mirrorDirectivesOnY(directives: DrawDirective[]): DrawDirective[] {
    return directives.map(dir => {
        switch (dir.type) {
            case 'M':
                return { type: 'M', x: -dir.x, y: dir.y };
            case 'L':
                return { type: 'L', x: -dir.x, y: dir.y };
            case 'C':
                return {
                    type: 'C',
                    x1: -dir.x1, y1: dir.y1,
                    x2: -dir.x2, y2: dir.y2,
                    x: -dir.x, y: dir.y
                };
            case 'A':
                return {
                    type: 'A',
                    rx: dir.rx, ry: dir.ry,
                    rotation: -dir.rotation,
                    largeArc: dir.largeArc,
                    sweep: !dir.sweep, // Flip sweep for mirroring
                    x: -dir.x, y: dir.y
                };
            case 'E':
                return { type: 'E' };
        }
    });
}

/**
 * Mirror directives around X-axis
 */
function mirrorDirectivesX(directives: DrawDirective[]): DrawDirective[] {
    return directives.map(dir => {
        switch (dir.type) {
            case 'M':
                return { type: 'M', x: dir.x, y: -dir.y };
            case 'L':
                return { type: 'L', x: dir.x, y: -dir.y };
            case 'C':
                return {
                    type: 'C',
                    x1: dir.x1, y1: -dir.y1,
                    x2: dir.x2, y2: -dir.y2,
                    x: dir.x, y: -dir.y
                };
            case 'A':
                return {
                    type: 'A',
                    rx: dir.rx, ry: dir.ry,
                    rotation: -dir.rotation,
                    largeArc: dir.largeArc,
                    sweep: !dir.sweep, // Flip sweep for mirroring
                    x: dir.x, y: -dir.y
                };
            case 'E':
                return { type: 'E' };
        }
    });
}

/**
 * Convert directives to SVG path string
 */
function directivesToPath(directives: DrawDirective[]): string {
    return directives.map(dir => {
        switch (dir.type) {
            case 'M':
                return `M ${dir.x} ${dir.y}`;
            case 'L':
                return `L ${dir.x} ${dir.y}`;
            case 'C':
                return `C ${dir.x1} ${dir.y1}, ${dir.x2} ${dir.y2}, ${dir.x} ${dir.y}`;
            case 'A':
                return `A ${dir.rx} ${dir.ry} ${dir.rotation} ${dir.largeArc ? 1 : 0} ${dir.sweep ? 1 : 0} ${dir.x} ${dir.y}`;
            case 'E':
                return 'Z';
            default:
                return '';
        }
    }).join(' ');
}

/**
 * Normalize bounds to -1,-1 to 1,1 space, maintaining aspect ratio
 */
function computeNormalizedViewBox(bounds: PathBounds): string {
    const width = bounds.maxX - bounds.minX;
    const height = bounds.maxY - bounds.minY;
    const maxDim = Math.max(width, height);
    
    if (maxDim === 0) {
        return '-1 -1 2 2';
    }
    
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    
    // Create a square viewBox centered on the content
    const halfSize = maxDim / 2;
    const left = centerX - halfSize;
    const top = centerY - halfSize;
    
    return `${left} ${top} ${maxDim} ${maxDim}`;
}

type Resource = ""; //linearGradient, radialGradient, pattern, clipPath, mask
type PredefinedResources = { [key: string]: Resource; }; //Any object containing only Resource types under any name

export interface SVGOptions<T extends PredefinedResources = {}> {
    modifiers?: PathModifier<T> | PathModifier<T>[];
    attributes?: JSX.SvgSVGAttributes<SVGSVGElement>;
    resources?: T;
}
const normalizeOptions = (options?: SVGOptions): Required<SVGOptions> => {
    return {
        modifiers: options?.modifiers 
            ? (Array.isArray(options.modifiers) ? options.modifiers : [options.modifiers]) 
            : [],
        attributes: options?.attributes ?? {},
        resources: options?.resources ?? {}
    };
}

const SVG0 = <T extends PredefinedResources = {}>(
    path: DrawDirective<T>[], 
    options?: SVGOptions<T>
): JSX.Element => {
    const { modifiers, attributes } = normalizeOptions(options);

    let computedPath = path;
    for (const modifier of Array.isArray(modifiers) ? modifiers : [modifiers]) {
        computedPath = modifier(computedPath);
    }
    
    // Compute bounds
    const bounds = getBounds(extractPoints(computedPath));
    
    return (
        <svg viewBox={computeNormalizedViewBox(bounds)} {...attributes}>
            <path d={directivesToPath(computedPath)} stroke="currentColor" fill="none" />
        </svg>
    );
};
/**
 * Simple utility taking a path and computing the viewbox so that the path is centered within it. 
 * The viewbox is computed in a normalized space maintaining aspect ratio
 */
export const SVG = SVG0;

type PathModifier<T extends PredefinedResources = {}> = (existingDirectives: DrawDirective<T>[]) => DrawDirective<T>[];

type vec2<T> = [T, T];
type vec3<T> = [T, T, T];
type int32 = number;
type uint32 = number;
type float32 = number;

export class Path {

    public static Symbol: { [key: string]: string } = {
        MoveTo: "M",
        MoveToRel: "m",
        LineTo: "L",
        LineToRel: "l",
        CurveTo: "C",
        CurveToRel: "c",
        ArcTo: "A",
        ArcToRel: "a",
        End: "E"
    } as const;

    public static Modifier = {

        Mirror: {
            X: (): PathModifier => {
                return (existingDirectives: DrawDirective[]) => {
                    return [...existingDirectives, ...mirrorDirectivesX(existingDirectives)]
                }
            },
            Y: (): PathModifier => {
                return (existingDirectives: DrawDirective[]) => {
                    return [...existingDirectives, ...mirrorDirectivesOnY(existingDirectives)]
                }
            }
        },

        Array: (direction: vec2<number>, spacing: number, count: uint32) => {
            return (existingDirectives: DrawDirective[]) => {
                const newDirectives: DrawDirective[] = [];
                for (let i = 0; i < count; i++) {
                    const offsetX = direction[0] * spacing * i;
                    const offsetY = direction[1] * spacing * i;
                    for (const dir of existingDirectives) {
                        switch (dir.type) {
                            case 'M':
                                newDirectives.push({ type: 'M', x: dir.x + offsetX, y: dir.y + offsetY });
                                break;
                            case 'L':
                                newDirectives.push({ type: 'L', x: dir.x + offsetX, y: dir.y + offsetY });
                                break;
                            case 'C':
                                newDirectives.push({
                                    type: 'C',
                                    x1: dir.x1 + offsetX, y1: dir.y1 + offsetY,
                                    x2: dir.x2 + offsetX, y2: dir.y2 + offsetY,
                                    x: dir.x + offsetX, y: dir.y + offsetY
                                });
                                break;
                            case 'A':
                                newDirectives.push({
                                    type: 'A',
                                    rx: dir.rx, ry: dir.ry,
                                    rotation: dir.rotation,
                                    largeArc: dir.largeArc,
                                    sweep: dir.sweep,
                                    x: dir.x + offsetX, y: dir.y + offsetY
                                });
                                break;
                            case 'E':
                                newDirectives.push({ type: 'E' });
                        }
                    }
                }
                return newDirectives;
            }
        }

    } as const;

    private static Vec2Directive<T extends PredefinedResources = {}>(symbol: keyof typeof Path.Symbol, vec: vec2<number>): DrawDirectiveSupplier<T> {
        return undefined as any;
    }

    public static LineTo = (x: number, y: number): DrawDirective => {
        return { type: 'L', x, y };
    }
    
    public static L = Path.LineTo;
    
    public static Curve = (
        x1: number, y1: number, 
        x2: number, y2: number, 
        x: number, y: number
    ): DrawDirective => {
        return { type: 'C', x1, y1, x2, y2, x, y };
    }
    
    public static C = Path.Curve;
    
    public static ArcTo = (
        rx: number, ry: number, 
        rotation: number, 
        largeArc: boolean, 
        sweep: boolean, 
        x: number, y: number
    ): DrawDirective => {
        return { type: 'A', rx, ry, rotation, largeArc, sweep, x, y };
    }
    
    public static A = Path.ArcTo;
    
    public static MoveTo = (x: number, y: number): DrawDirective => {
        return { type: 'M', x, y };
    }
    
    public static M = Path.MoveTo;
    
    public static End = (): DrawDirective => {
        return { type: 'E' };
    }
    
    public static E = Path.End;
}

