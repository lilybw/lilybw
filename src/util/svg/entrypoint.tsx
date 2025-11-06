import { JSX } from "solid-js/jsx-runtime";
import { PredefinedResources, SVGOptions, PathModifier, vec2, uint32, DrawDirectiveSupplier, PathOptions, DD2, DD2CVec2, DD2CCurve, DD2CArc, DD2CE } from "./types";
import { normalizeSVGOptions, getBounds, extractPoints, computeNormalizedViewBox, directivesToPath, normalizePathOptions } from "./svgUtil";
import { _PathModifiers } from "./modifiers";
import { _DirectiveSymbols, DirectiveSymbol } from "./symbol";

/* TEMP */
type __typeOfDirective<T extends PredefinedResources = {}> = DD2<T>;
type SelfOrSupplier<T,K> = T | ((res: K) => T);
type DirectiveOrSupplier<T extends PredefinedResources = {}> = SelfOrSupplier<__typeOfDirective<T>, T>;

type OptionsPathTuple<T extends PredefinedResources = {}> = [DirectiveOrSupplier<T>[], PathOptions<T>?];

// Recursive type that builds: [directives[], options?, directives[], options?, ...]
type FlattenedArgs<T extends readonly PredefinedResources[]> = 
    T extends readonly [infer First extends PredefinedResources, ...infer Rest extends readonly PredefinedResources[]]
        ? [DirectiveOrSupplier<First>[], PathOptions<First>?, ...FlattenedArgs<Rest>]
        : [];

type SVGEntrypoint = <T extends readonly PredefinedResources[]>(
    ...args: FlattenedArgs<T>
) => JSX.Element;

const SVG0 = (options?: SVGOptions): SVGEntrypoint => {
    const normalized = normalizeSVGOptions(options);

    // args: [directives[], options?, directives[], options?, ...]
    return (...args) => {
        // Pair up the arguments: [directives, options, directives, options, ...]
        // becomes [[directives, options?], [directives, options?], ...]
        const pairs: OptionsPathTuple<any>[] = [];
        
        for (let i = 0; i < args.length; i++) {
            const current = args[i];
            
            if (Array.isArray(current)) {
                // This is a directives array
                const nextArg = args[i + 1];
                const options = (nextArg && !Array.isArray(nextArg)) ? nextArg : undefined;
                
                pairs.push([current, options]);
                
                if (options !== undefined) i++;
            }
        }

        const resolvedPairs = pairs.map(([directivesInput, pathOptions]) => {
            const pathOpts = pathOptions ? pathOptions : {} as PathOptions<any>;
            const normalizedPathOpts = normalizePathOptions(pathOpts);
            const resolvedDirectives: __typeOfDirective<any>[] = [];
            
            for (const directive of directivesInput) {
                if (typeof directive === 'function') { //Supplier
                    resolvedDirectives.push(directive(normalizedPathOpts.resources));
                } else {
                    resolvedDirectives.push(directive);
                }
            }

            let modifiedDirectives = resolvedDirectives;

            for (const modifier of Array.isArray(normalizedPathOpts.modifiers) ? normalizedPathOpts.modifiers : [normalizedPathOpts.modifiers]) {
                modifiedDirectives = modifier(modifiedDirectives);
            }
            
            return [modifiedDirectives, normalizedPathOpts.attributes] as [__typeOfDirective<any>[], JSX.PathSVGAttributes<SVGPathElement>];
        });

        
        return (
            <svg {...normalized.attributes}>
                {resolvedPairs.map((pair, idx) => (
                    <path d={directivesToPath(pair[0])} {...pair[1]} />
                ))}
                {normalized.children}
            </svg>
        );
    };
};
/**
 * Simple utility taking a path and computing the viewbox so that the path is centered within it. 
 * The viewbox is computed in a normalized space maintaining aspect ratio
 */
export const SVG = SVG0;

export class Path {

    public static Symbol = _DirectiveSymbols;

    public static Modifier = _PathModifiers;

    private static Vec2Directive<T extends PredefinedResources = {}>(symbol: DirectiveSymbol, vec: vec2<number>): DD2<T> {
        return new DD2CVec2(symbol, vec);
    }

    public static LineTo = (x: number, y: number): DD2<any> => {
        return Path.Vec2Directive('L', [x, y]);
    }
    
    public static L = Path.LineTo;
    
    public static Curve = (
        x1: number, y1: number, 
        x2: number, y2: number, 
        x: number, y: number
    ): DD2<any> => {
        return new DD2CCurve(x1, y1, x2, y2, x, y);
    }
    
    public static C = Path.Curve;
    
    public static ArcTo = (
        rx: number, ry: number, 
        rotation: number, 
        largeArc: boolean, 
        sweep: boolean, 
        x: number, y: number
    ): DD2<any> => {
        return new DD2CArc(rx, ry, rotation, largeArc, sweep, x, y);
    }
    
    public static A = Path.ArcTo;

    public static MoveTo = (x: number, y: number): DD2<any> => {
        return Path.Vec2Directive(Path.Symbol.MoveTo, [x, y]);
    }
    
    public static M = Path.MoveTo;
    
    public static End = (): DD2<any> => {
        return new DD2CE();
    }
    
    public static E = Path.End;
}
