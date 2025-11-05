import { Component, JSX } from "solid-js";
import { DrawDirective, vec2, PathBounds, PredefinedResources, PathModifier, uint32, DrawDirectiveSupplier, SVGOptions, PathOptions } from "./types";

/**
 * Extract all points from draw directives for bounds calculation
 */
export function extractPoints(directives: DrawDirective[]): vec2<number>[] {
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
export function getBounds(points: vec2<number>[]): PathBounds {
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
export function mirrorDirectivesOnY(directives: DrawDirective[]): DrawDirective[] {
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
export function mirrorDirectivesX(directives: DrawDirective[]): DrawDirective[] {
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
export function directivesToPath(directives: DrawDirective[]): string {
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
export function computeNormalizedViewBox(bounds: PathBounds): string {
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

export const normalizeSVGOptions = (options?: SVGOptions): Required<SVGOptions> => {
    return {
        attributes: options?.attributes ?? {},
        children: options?.children ?? null   
    };
}

export const normalizePathOptions = <T extends PredefinedResources = {}>(options: PathOptions<T>): Required<PathOptions<T>> => {
    return {
        modifiers: options?.modifiers 
                ? (Array.isArray(options.modifiers) ? options.modifiers : [options.modifiers]) 
                : [],
        attributes: options?.attributes ?? {},
        resources: options?.resources ?? {} as T
    };
}
