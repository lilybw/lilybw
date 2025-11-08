import { Component, JSX } from "solid-js";
import { vec2, PathBounds, PredefinedResources, SVGOptions, PathOptions, DrawDirective, FlattenedArgs, OptionsPathTuple, DirectiveOrSupplier } from "./types";
import { _DirectiveSymbols } from "./symbol";
import { Path } from "./entrypoint";

// Pair up the arguments: [directives, options, directives, options, ...]
// becomes [[directives, options?], [directives, options?], ...]
export const normalizeEntrypointArgs = (
    args: ((DirectiveOrSupplier<any> | DirectiveOrSupplier<any>[])[] | PathOptions<any>)[]
): OptionsPathTuple<any>[] => {

    const pairs: OptionsPathTuple<any>[] = [];
    
    for (let i = 0; i < args.length; i++) {
        const current = args[i];
        
        // path directives, may be array of arrays or single array
        if (Array.isArray(current) && current.length !== 0) {
            let directives: DirectiveOrSupplier<any>[] 
                = Array.isArray(current) ? current.flatMap(d => d) : current;
            
            // Auto insert M 0 0 if missing
            const firstDirective = directives[0];
            if (
                typeof firstDirective === 'function' 
                || firstDirective.getSymbol() !== _DirectiveSymbols.MoveTo
            ) {
                directives = [Path.MoveTo(0, 0), ...directives];
            }

            // Auto end if no end
            const lastDirective = directives[directives.length - 1];   
            if (
                typeof lastDirective === 'function' 
                || lastDirective.getSymbol() !== _DirectiveSymbols.End
            ) {
                directives = [...directives, Path.End()];
            }

            const nextArg = args[i + 1];
            const options = (nextArg && !Array.isArray(nextArg)) ? nextArg as PathOptions<any> : undefined;
            
            pairs.push([directives, options]);
            
            if (options !== undefined) i++;
        }
    }
    return pairs;
}


/**
 * Extract all points from draw directives for bounds calculation
 */
export function extractPoints(directives: DrawDirective[]): vec2<number>[] {
    const points: vec2<number>[] = [];

    for (const dir of directives) {
        for (const point of dir.getPoints()) {
            points.push(point);
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

export function mirrorCustomVec2(
  point: vec2<number>,
  axisOffset: vec2<number>,
  axisAngle: number // in radians
): vec2<number> {
  const translatedX = point[0] - axisOffset[0];
  const translatedY = point[1] - axisOffset[1];
  
  const cos = Math.cos(-axisAngle);
  const sin = Math.sin(-axisAngle);
  const rotatedX = translatedX * cos - translatedY * sin;
  const rotatedY = translatedX * sin + translatedY * cos;
  
  const mirroredY = -rotatedY;
  
  const cos2 = Math.cos(axisAngle);
  const sin2 = Math.sin(axisAngle);
  const unrotatedX = rotatedX * cos2 - mirroredY * sin2;
  const unrotatedY = rotatedX * sin2 + mirroredY * cos2;
  
  return [ unrotatedX + axisOffset[0], unrotatedY + axisOffset[1]];
}

/**
 * Convert directives to SVG path string
 */
export function directivesToPath(directives: DrawDirective<any>[]): string {
    return directives.map(dir => dir.toPathString()).join(' ');
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

export const normalizeSVGOptions = (options?: SVGOptions, className?: string | SVGOptions): Required<SVGOptions> => {
    if (typeof className === 'object' && className !== null) {
        options = className;
    }

    const resolvedDefs: PredefinedResources = {};
    for (
        const [key, value] of Object.entries(((options?.defs ?? {}) as PredefinedResources))
            .filter(([_, v]) => v !== null && v !== undefined)
    ) {
        value.setName(key); 
        resolvedDefs[key] = value;
    }

    const resolvedOptions: SVGOptions = {};
    resolvedOptions.defs = resolvedDefs;
    resolvedOptions.htmlAttributes = options?.htmlAttributes ?? {};

    if (className && typeof className === 'string') {
        resolvedOptions.htmlAttributes.class = className;
    }

    resolvedOptions.children = options?.children ?? null;

    return resolvedOptions as Required<SVGOptions>;
}

export const normalizePathOptions = <T extends PredefinedResources = {}>(options: PathOptions<T>): Required<PathOptions<T>> => {
    return {
        modifiers: options?.modifiers 
                ? (Array.isArray(options.modifiers) ? options.modifiers : [options.modifiers]) 
                : [],
        htmlAttributes: options?.htmlAttributes ?? {},
    };
}

export const resolveReferencedDefs = <T extends PredefinedResources = {}>(svgID: string, defs: T, attributes: PathOptions<T>['htmlAttributes']): JSX.PathSVGAttributes<SVGPathElement> => {
    if (!attributes) { return {}; }

    if (typeof attributes === 'function') {
        //Resolve supplier if supplier
        attributes = attributes(defs);
    }

    const resolvedAttributes: JSX.PathSVGAttributes<SVGPathElement> = {};
    for (const [key, value] of Object.entries(attributes)) {
        if (value && typeof value === 'object' && 'getURL' in value && typeof value.getURL === 'function') {
            //@ts-ignore
            resolvedAttributes[key] = `url(#${value.getURL()}-${svgID})`;
        } else {
            //@ts-ignore
            resolvedAttributes[key] = value;
        }
    }

    return resolvedAttributes;
};
