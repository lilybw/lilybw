import { JSX } from "solid-js/jsx-runtime";
import { PredefinedResources, SVGOptions, PathModifier, vec2, uint32, DrawDirectiveSupplier, PathOptions, DrawDirective, DrawDirectiveVec2, DrawDirectiveCurve, DrawDirectiveArc, DDEndOfPath, FlattenedArgs, DirectiveOrSupplier } from "./types";
import { normalizeSVGOptions, getBounds, extractPoints, computeNormalizedViewBox, directivesToPath, normalizePathOptions, normalizeEntrypointArgs } from "./svgUtil";
import { _PathModifiers } from "./modifiers";
import { _DirectiveSymbols, DirectiveSymbol } from "./symbol";

type SVGEntrypoint = (
    ...args: (DirectiveOrSupplier<any>[] | PathOptions<any>)[]
) => JSX.Element;

const SVG0 = (options?: SVGOptions): SVGEntrypoint => {
    const normalized = normalizeSVGOptions(options);

    // args: [directives[], options?, directives[], options?, ...]
    return (...args) => {
        const pairs = normalizeEntrypointArgs(args);

        const resolvedPairs = pairs.map(([directivesInput, pathOptions]) => {
            const pathOpts = pathOptions ? pathOptions : {} as PathOptions<any>;
            const normalizedPathOpts = normalizePathOptions(pathOpts);
            const resolvedDirectives: DrawDirective<any>[] = [];
            
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
            
            return [modifiedDirectives, normalizedPathOpts.attributes] as [DrawDirective<any>[], JSX.PathSVGAttributes<SVGPathElement>];
        });

        const bounds = getBounds(
            resolvedPairs
                .flatMap(pair => pair[0]
                    .flatMap(dir => dir.getPoints()
                )
            )
        );

        return (
            <svg viewBox={computeNormalizedViewBox(bounds)} {...normalized.attributes} >
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

    private static Vec2Directive<T extends PredefinedResources = {}>(symbol: DirectiveSymbol, vec: vec2<number>): DrawDirective<T> {
        return new DrawDirectiveVec2(symbol, vec);
    }

    public static LineTo = (x: number, y: number): DrawDirective<any> => {
        return Path.Vec2Directive('L', [x, y]);
    }
    
    public static L = Path.LineTo;
    
    public static Curve = (
        x1: number, y1: number, 
        x2: number, y2: number, 
        x: number, y: number
    ): DrawDirective<any> => {
        return new DrawDirectiveCurve(x1, y1, x2, y2, x, y);
    }
    
    public static C = Path.Curve;
    
    public static ArcTo = (
        rx: number, ry: number, 
        rotation: number, 
        largeArc: boolean, 
        sweep: boolean, 
        x: number, y: number
    ): DrawDirective<any> => {
        return new DrawDirectiveArc(rx, ry, rotation, largeArc, sweep, x, y);
    }
    
    public static A = Path.ArcTo;

    public static MoveTo = (x: number, y: number): DrawDirective<any> => {
        return Path.Vec2Directive(Path.Symbol.MoveTo, [x, y]);
    }
    
    public static M = Path.MoveTo;
    
    public static End = (): DrawDirective<any> => {
        return new DDEndOfPath();
    }
    
    public static E = Path.End;
}
