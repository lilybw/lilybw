import { JSX } from "solid-js/jsx-runtime";
import { PredefinedResources, SVGOptions, PathModifier, vec2, uint32, DrawDirectiveSupplier, PathOptions, DrawDirective, DrawDirectiveVec2, DrawDirectiveCurve, DrawDirectiveArc, DDEndOfPath, FlattenedArgs, DirectiveOrSupplier } from "./types";
import { normalizeSVGOptions, getBounds, extractPoints, computeNormalizedViewBox, directivesToPath, normalizePathOptions, normalizeEntrypointArgs, resolveReferencedDefs } from "./svgUtil";
import { _PathModifiers } from "./pathModifiers";
import { _DirectiveSymbols, DirectiveSymbol } from "./symbol";
import { getNextHash } from "../hashUtil";

type SVGEntrypoint<T extends PredefinedResources = {}> = (
    ...args: (DirectiveOrSupplier<T>[] | PathOptions<T>)[]
) => JSX.Element;

const SVG0 = <T extends PredefinedResources>(options?: SVGOptions<T>): SVGEntrypoint<T> => {
    const normalizedSVGOptions = normalizeSVGOptions(options);

    // generate random id hash for entire svg element
    const svgId = getNextHash();

    const renderedDefs = appendDefs( normalizedSVGOptions.defs, svgId );

    // args: [directives[], options?, directives[], options?, ...]
    return (...args) => {
        const pairs = normalizeEntrypointArgs(args);

        const resolvedPaths = pairs.map(([directivesInput, pathOptions]) => {
            const pathOpts = pathOptions ? pathOptions : {} as PathOptions<any>;
            const normalizedPathOpts = normalizePathOptions(pathOpts);
            const resolvedDirectives: DrawDirective<any>[] = [];
            
            for (const directive of directivesInput) {
                if (typeof directive === 'function') { //Supplier
                    resolvedDirectives.push(directive(normalizedSVGOptions.defs));
                } else {
                    resolvedDirectives.push(directive);
                }
            }

            let modifiedDirectives = resolvedDirectives;

            for (const modifier of Array.isArray(normalizedPathOpts.modifiers) ? normalizedPathOpts.modifiers : [normalizedPathOpts.modifiers]) {
                modifiedDirectives = modifier(modifiedDirectives);
            }

            const pathID = getNextHash();
            
            return new Path(pathID, modifiedDirectives, normalizedPathOpts.htmlAttributes);
        });

        const bounds = getBounds(
            resolvedPaths
                .flatMap( path => path.directives
                    .flatMap( dir => dir.getPoints()
                )
            )
        );

        return (
            <svg id={`svg-${svgId}`} viewBox={computeNormalizedViewBox(bounds)} xmlns="http://www.w3.org/2000/svg" {...normalizedSVGOptions.htmlAttributes} >
                {renderedDefs}
                {resolvedPaths.map((path, idx) => (
                    <path d={directivesToPath(path.directives)} {...resolveReferencedDefs(svgId, normalizedSVGOptions.defs, path.attributes)} />
                ))}
                {normalizedSVGOptions.children}
            </svg>
        );
    };
};
/**
 * Simple utility taking a path and computing the viewbox so that the path is centered within it. 
 * The viewbox is computed in a normalized space maintaining aspect ratio
 */
export const SVG = SVG0;

const appendDefs = <T extends PredefinedResources>(defs: T, svgId: string): JSX.Element | null => {
    if (!defs) return null;

    return (
        <defs>
            {Object.values(defs).map(def => def.toJSXElement(svgId))}
        </defs>
    );
}

export class Path<T extends PredefinedResources = {}> {

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

    constructor(
        public readonly id: string,
        public readonly directives: DrawDirective<T>[],
        public readonly attributes: PathOptions<T>['htmlAttributes'] = {}
    ) {}
}
