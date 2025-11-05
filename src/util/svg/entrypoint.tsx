import { JSX } from "solid-js/jsx-runtime";
import { PredefinedResources, DrawDirective, SVGOptions, PathModifier, vec2, uint32, DrawDirectiveSupplier, PathOptions } from "./types";
import { normalizeSVGOptions, getBounds, extractPoints, computeNormalizedViewBox, directivesToPath, mirrorDirectivesX, mirrorDirectivesOnY, normalizePathOptions } from "./svgUtil";

/* TEMP */
type __typeOfDirective<T extends PredefinedResources = {}> = DrawDirective<T>;
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

const experiment = <T extends PredefinedResources = {}>(options?: SVGOptions): SVGEntrypoint => {
    const normalized = normalizeSVGOptions(options);

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
                
                // Skip the options if we consumed it
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
            
            return [modifiedDirectives, normalizedPathOpts.attributes] as [DrawDirective<any>[], JSX.PathSVGAttributes<SVGPathElement>];
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

const SVG0 = <T extends PredefinedResources = {}>(
    path: DrawDirective<T>[], 
    options?: SVGOptions<T>
): JSX.Element => {
    const { modifiers, attributes } = normalizeSVGOptions(options);

    let computedPath = path;
    for (const modifier of Array.isArray(modifiers) ? modifiers : [modifiers]) {
        computedPath = modifier(computedPath);
    }
    
    // Compute bounds
    const bounds = getBounds(extractPoints(computedPath));
    
    return (
        <svg viewBox={computeNormalizedViewBox(bounds)} {...attributes}>
            <path d={directivesToPath(computedPath)} fill="none" />
        </svg>
    );
};
/**
 * Simple utility taking a path and computing the viewbox so that the path is centered within it. 
 * The viewbox is computed in a normalized space maintaining aspect ratio
 */
export const SVG = SVG0;


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
