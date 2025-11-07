import { JSX } from "solid-js/jsx-runtime";
import { InternalResource, normalizeVector2, ReferencableRessource, vec2, vec4 } from "./types";

export type GradientStop = [number, string]; //offset percentage 0-100, color string
export interface LinearGradientOptions {
    /** Either as a normalized vector or an angle in degrees */
    direction?: vec2<number> | number;
    attributes?: JSX.LinearGradientSVGAttributes<SVGLinearGradientElement>;
}

export class LinearGradient implements InternalResource, ReferencableRessource {
    private name: string = 'unnamed-linear-gradient';
    private readonly resolvedDirection: vec4<number>; //As a series of percentages [x1, y1, x2, y2] in 0-100 range
    private readonly resolvedOptions: LinearGradientOptions;

    constructor(
        private readonly stops: GradientStop[],
        /** Either as a normalized vector or an angle in degrees */
        options?: LinearGradientOptions,
    ) {
        options = options ?? {};
        let { direction } = options;
        direction = direction ?? 0;
        this.resolvedOptions = options;

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
                {this.stops.map((stop) => (
                    <stop offset={`${stop[0]}%`} stop-color={stop[1]} />
                ))}
            </linearGradient>
        );
    }
}
