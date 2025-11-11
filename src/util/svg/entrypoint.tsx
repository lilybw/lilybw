import { JSX } from "solid-js/jsx-runtime";
import { PredefinedResources, SVGOptions, vec2, PathOptions, DrawDirective, DrawDirectiveVec2, DrawDirectiveCurve, DrawDirectiveArc, DDEndOfPath, DirectiveOrSupplier, InternalResource, ReferencableResource, GuaranteedResources, ComputedResources, UserDefinedResources } from "./types";
import { normalizeSVGOptions, getBounds, computeNormalizedViewBox, normalizePathOptions, normalizeEntrypointArgs, formatSVGElementID, applyDirectiveModifiers } from "./svgUtil";
import { _PathModifiers } from "./pathModifiers";
import { _DirectiveSymbols, DirectiveSymbol } from "./symbol";
import { getNextHash } from "../hashUtil";
import { convergeToArray } from "../arrayUtil";

type SVGEntrypoint<T extends UserDefinedResources = {}> = (
    ...args: ((DirectiveOrSupplier<T & ComputedResources> | DirectiveOrSupplier<T & ComputedResources>[])[] | PathOptions<T & ComputedResources>)[]
) => JSX.Element;

const SVG0 = <T extends UserDefinedResources>(className?: string | SVGOptions<T>, options?: SVGOptions<T>): SVGEntrypoint<T> => {
    //Resolve what param the options are in if present
    const normalizedSVGOptions = normalizeSVGOptions(
        options, className
    );

    // generate random id hash for entire svg element
    const svgId = getNextHash();

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

            let modifiedDirectives = applyDirectiveModifiers(
                resolvedDirectives, 
                convergeToArray(normalizedPathOpts.modifiers)
            );
            
            return new Path(modifiedDirectives, normalizedPathOpts.htmlAttributes);
        });


        const bounds = getBounds(
            resolvedPaths
                .flatMap( path => path.directives
                    .flatMap( dir => dir.getPoints()
                )
            )
        );

        const computedDefs: ComputedResources = {
            dimensions: [bounds.maxX - bounds.minX, bounds.maxY - bounds.minY]
        }
        const predefinedResources = {...normalizedSVGOptions.defs, ...computedDefs};

        const renderedDefs = appendDefs( normalizedSVGOptions.defs, predefinedResources, svgId );

        return (
            <svg id={`svg-${svgId}`} viewBox={computeNormalizedViewBox(bounds)} xmlns="http://www.w3.org/2000/svg" {...normalizedSVGOptions.htmlAttributes} >
                {renderedDefs}
                {resolvedPaths.map((path, idx) => path.toJSXElement(svgId, predefinedResources))}
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

const appendDefs = <T extends UserDefinedResources>(internalRessources: T, defs: T & ComputedResources, svgId: string): JSX.Element | null => {
    if (!defs) return null;

    return ( <defs>{ Object.values(internalRessources).map(def => def.toJSXElement(svgId, defs)) }</defs> );
}

export class Path<T extends PredefinedResources = GuaranteedResources> 
    implements InternalResource, ReferencableResource 
{

    public static Symbol = _DirectiveSymbols;
    public static Modifier = _PathModifiers;

    private static Vec2Directive<T extends PredefinedResources = GuaranteedResources>(symbol: DirectiveSymbol, vec: vec2<number>): DrawDirective<T> {
        return new DrawDirectiveVec2(symbol, vec);
    }

    public static LineTo = (x: number, y: number): DrawDirective<any> => {
        return Path.Vec2Directive(_DirectiveSymbols.LineTo, [x, y]);
    }
    public static Curve = (
        x1: number, y1: number, 
        x2: number, y2: number, 
        x: number, y: number
    ): DrawDirective<any> => {
        return new DrawDirectiveCurve(x1, y1, x2, y2, x, y);
    }
    public static ArcTo = (
        rx: number, ry: number, 
        rotation: number, 
        largeArc: boolean, 
        sweep: boolean, 
        x: number, y: number
    ): DrawDirective<any> => {
        return new DrawDirectiveArc(rx, ry, rotation, largeArc, sweep, x, y);
    }
    public static MoveTo = (x: number, y: number): DrawDirective<any> => {
        return Path.Vec2Directive(_DirectiveSymbols.MoveTo, [x, y]);
    }
    public static End = (): DrawDirective<any> => {
        return new DDEndOfPath();
    }

    //Aliases
    public static L = Path.LineTo;
    public static C = Path.Curve;
    public static A = Path.ArcTo;
    public static M = Path.MoveTo;
    public static E = Path.End;
    public static Z = Path.End;

    public static Rect = (x: number, y: number, width: number, height: number): DrawDirective<any>[] => {
        return [
            Path.M(x, y),
            Path.L(x + width, y),
            Path.L(x + width, y + height),
            Path.L(x, y + height),
            Path.L(x, y),
            Path.E()
        ];
    }
    public static Ellipse = (cx: number, cy: number, r1: number, r2: number): DrawDirective<any>[] => {
        return [
            Path.M(cx, cy - r1),
            Path.A(r1, r2, 0, true, false, cx + r1, cy),
            Path.A(r1, r2, 0, true, false, cx, cy - r1),
            Path.E()
        ];
    }

    private name: string = 'unnamed-path-' + getNextHash();
    constructor(
        public readonly directives: DrawDirective<T>[],
        public readonly attributes: PathOptions<T>['htmlAttributes'] = {}
    ) {}

    setName(name: string): void {
        this.name = name;
    }

    toJSXElement(svgId: string, defs: PredefinedResources): JSX.Element {
        return (
            <path 
                id={formatSVGElementID(svgId, this.name)} 
                d={this.toFormattedPath()} 
                {...this.resolveReferencedDefs(svgId, defs as T, this.attributes)} 
            />
        );
    }

    getURL(): string {
        return this.name;
    }

    toFormattedPath(): string {
        return this.directives.map(dir => dir.toPathString()).join(' ');
    }
    
    private resolveReferencedDefs = <T extends PredefinedResources = GuaranteedResources>
        (svgID: string, defs: T, attributes: PathOptions<T>['htmlAttributes']): JSX.PathSVGAttributes<SVGPathElement> => 
    {
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
    }
}
