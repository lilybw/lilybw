import { JSX } from "solid-js/jsx-runtime";
import { CSSColorLike, InternalResource, normalizeVector2, ReferencableResource, vec2, vec4 } from "./types";

export type GradientStop = [string, number]; //offset percentage 0-100, color string
export interface LinearGradientOptions {
    /** Either as a normalized vector or an angle in degrees */
    direction?: vec2<number> | number;
    attributes?: JSX.LinearGradientSVGAttributes<SVGLinearGradientElement>;
}

export const parseVarargs = (args: (CSSColorLike | number)[]): GradientStop[] => {
    const tuples: GradientStop[] = [];

    if (!args || args.length === 0) {
        return tuples;
    }

    let currentStop: GradientStop = ["",0];
    let currentStopHasColor = false;

    for (
        const [index, colorOrPercentage] of 
        (Object.entries(args) as unknown as [number, string | number][])
    ) {

        if (typeof colorOrPercentage === "number") {
            currentStop[1] = colorOrPercentage < 1 ? colorOrPercentage * 100 : colorOrPercentage;
        } else {

            if (currentStopHasColor) {
                //Advance
                currentStopHasColor = false;
                tuples.push(currentStop);
                currentStop = ["", -1];
            }

            currentStop[0] = colorOrPercentage;
            currentStopHasColor = true;
        }
    }

    if (tuples.length >= 2 && tuples[tuples.length - 1][1] === -1) {
        //Special case with but 2 stops where theyre expected to end up at 0 and 100.
        //Unless the user has specified otherwise
        //Also in any other case where the final stop has no set percentage, set it to 100
        tuples[tuples.length - 1][1] = 100;
    }

    let latestStopPercentage = Math.max(tuples[0][1], 0);
    // Skip first for it wont ever have to be interpolated if its percetage missing
    // Also always skip the last one, as that will always be 100 OR whatever the user has set
    for ( let i = 1; i < tuples.length - 1; i++ ) {
        const current = tuples[i];

        if ( current[1] < 0 ) {
            let nextStopPercentage = 100;

            for ( let j = i; j < tuples.length; j++ ) {
                // Scan forward for next
                if (tuples[j][1] > latestStopPercentage) {
                    nextStopPercentage = tuples[j][1];
                    break;
                } 
            }

            current[1] = (nextStopPercentage - latestStopPercentage) * 0.5 + latestStopPercentage;
        }

        latestStopPercentage = Math.max(current[1], latestStopPercentage);
    }

    return tuples;
}

export class LinearGradient implements InternalResource, ReferencableResource {
    private name: string = 'unnamed-linear-gradient';
    private readonly resolvedDirection: vec4<number>; //As a series of percentages [x1, y1, x2, y2] in 0-100 range
    private readonly resolvedOptions: LinearGradientOptions;
    private readonly resolvedStops: GradientStop[];

    constructor(
        /** Either as a normalized vector or an angle in degrees */
        options?: LinearGradientOptions,
        ...stops: (CSSColorLike | number)[]
    ) {
        options = options ?? {};
        let { direction } = options;
        direction = direction ?? 0;
        this.resolvedOptions = options;
        this.resolvedStops = parseVarargs(stops);

        if (typeof direction === 'number') {
            const angleRad = direction * (Math.PI / 180);
            //Reducing number of cos and sin calls
            const sinValue = Math.sin(angleRad);
            const cosValue = Math.cos(angleRad);

            this.resolvedDirection = [
                50 + 50 * cosValue,
                50 + 50 * sinValue,
                50 - 50 * cosValue,
                50 - 50 * sinValue,
            ];
        } else {
            direction = normalizeVector2(direction);
            this.resolvedDirection = [
                50 + direction[0],
                50 + direction[1],
                50 - direction[0],
                50 - direction[1],
            ];
        }
    }
    

    getURL(): string {
        return this.name;
    }

    setName(name: string): void {
        this.name = name;
    }

    toJSXElement(svgId: string): JSX.Element {
        return (
            <linearGradient id={`${this.name}-${svgId}`}
                x1={`${this.resolvedDirection[0]}%`} 
                y1={`${this.resolvedDirection[1]}%`} 
                x2={`${this.resolvedDirection[2]}%`} 
                y2={`${this.resolvedDirection[3]}%`}
                {...this.resolvedOptions.attributes}
            >
                {this.resolvedStops.map((stop) => (
                    <stop offset={`${stop[1]}%`} stop-color={stop[0]} />
                ))}
            </linearGradient>
        );
    }
}
