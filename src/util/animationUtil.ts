
export type CleanUpFunction = () => void;

export interface CSSPropertyConfig {
    name: string,
    target: HTMLElement
}

export const CSSProperty = (config: CSSPropertyConfig) => {
    return {
        set: (value: string) => {
            config.target.style.setProperty(config.name, value);
        },
        get: () => {
            return getComputedStyle(config.target).getPropertyValue(config.name);
        },
        oscillate: (min: number, max: number, frequency: number): CleanUpFunction => {
            let start: number;
            let animationFrameId: number;
            const tStart = Date.now();
            const step = (timestamp: number) => {
                const elapsedS = (timestamp - tStart) / 1000;
                const value = min + (max - min) * 0.5 * (1 + Math.sin(elapsedS * frequency * 2 * Math.PI - Math.PI / 2));
                config.target.style.setProperty(config.name, value.toString());
                animationFrameId = requestAnimationFrame(step);
            };
            animationFrameId = requestAnimationFrame(step);
            return () => {
                cancelAnimationFrame(animationFrameId);
            };
        },
        asFunctionOfElapsedTimeS: (func: (elapsedSeconds: number) => number): CleanUpFunction => {
            let animationFrameId: number;
            const tStart = performance.now(); // DOMHighResTimeStamp is not from epoch
            const step = (timestamp: number) => {
                const elapsedS = (timestamp - tStart) / 1000;
                const value = func(elapsedS);
                config.target.style.setProperty(config.name, value.toString());
                animationFrameId = requestAnimationFrame(step);
            };
            animationFrameId = requestAnimationFrame(step);
            return () => {
                cancelAnimationFrame(animationFrameId);
            };
        }

    }
}

