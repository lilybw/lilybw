import { Component, JSX } from "solid-js";

export type DrawDirective = 
    | { type: 'M'; x: number; y: number }
    | { type: 'L'; x: number; y: number }
    | { type: 'C'; x1: number; y1: number; x2: number; y2: number; x: number; y: number }
    | { type: 'A'; rx: number; ry: number; rotation: number; largeArc: boolean; sweep: boolean; x: number; y: number }
    | { type: 'E' };

interface Point {
    x: number;
    y: number;
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
function extractPoints(directives: DrawDirective[]): Point[] {
    const points: Point[] = [];
    
    for (const dir of directives) {
        switch (dir.type) {
            case 'M':
            case 'L':
                points.push({ x: dir.x, y: dir.y });
                break;
            case 'C':
                points.push(
                    { x: dir.x1, y: dir.y1 },
                    { x: dir.x2, y: dir.y2 },
                    { x: dir.x, y: dir.y }
                );
                break;
            case 'A':
                points.push({ x: dir.x, y: dir.y });
                // For arcs, we approximate by including the radii as potential bounds
                points.push(
                    { x: dir.x + dir.rx, y: dir.y + dir.ry },
                    { x: dir.x - dir.rx, y: dir.y - dir.ry }
                );
                break;
        }
    }
    
    return points;
}

/**
 * Calculate bounds of points
 */
function getBounds(points: Point[]): PathBounds {
    if (points.length === 0) {
        return { minX: -1, maxX: 1, minY: -1, maxY: 1 };
    }

    return points.reduce(
        (bounds, p) => ({
            minX: Math.min(bounds.minX, p.x),
            maxX: Math.max(bounds.maxX, p.x),
            minY: Math.min(bounds.minY, p.y),
            maxY: Math.max(bounds.maxY, p.y),
        }),
        { minX: points[0].x, maxX: points[0].x, minY: points[0].y, maxY: points[0].y }
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

export enum PathModifier {
    MirrorX, MirrorY
}

export interface SVGOptions {
    modifiers?: PathModifier | PathModifier[];
    attributes?: JSX.SvgSVGAttributes<SVGSVGElement>;
}
const normalizeOptions = (options?: SVGOptions): Required<SVGOptions> => {
    return {
        modifiers: options?.modifiers 
            ? (Array.isArray(options.modifiers) ? options.modifiers : [options.modifiers]) 
            : [],
        attributes: options?.attributes ?? {}
    };
}

const SVG0 = (
    path: DrawDirective[], 
    options?: SVGOptions
): JSX.Element => {
    const {modifiers, attributes} = normalizeOptions(options);

    let computedPath = path;
    for (const modifier of Array.isArray(modifiers) ? modifiers : [modifiers]) {
        switch (modifier) {
            case PathModifier.MirrorX: computedPath = [...computedPath, ...mirrorDirectivesX(computedPath)]; break;
            case PathModifier.MirrorY: computedPath = [...computedPath, ...mirrorDirectivesOnY(computedPath)]; break;
        }
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

export class Path {
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

// Example usage:
// const myPath = [
//     Path.M(0, 0),
//     Path.L(50, 50),
//     Path.C(60, 60, 70, 40, 100, 50),
//     Path.E()
// ];
// 
// <SVG path={myPath} width="400" height="400" />