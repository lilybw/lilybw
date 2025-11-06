import { appendMutatedCopy } from "../arrayUtil";
import { PathModifier, DD2, vec2, uint32 } from "./types"

export const _PathModifiers = {

    Mirror: {
        X: (): PathModifier => {
            return (existingDirectives: DD2<any>[]) => {
                return appendMutatedCopy(existingDirectives, (dir) => dir.getMirroredOnX());
            }
        },
        Y: (): PathModifier => {
            return (existingDirectives: DD2<any>[]) => {
                return appendMutatedCopy(existingDirectives, (dir) => dir.getMirroredOnY());
            }
        },
        Angle: (angleRad: number): PathModifier => {
            return (existingDirectives: DD2<any>[]) => {
                return appendMutatedCopy(existingDirectives, (dir) => dir.getMirroredCustom([0,0], angleRad));
            }
        },
        Custom: (axisOffset: vec2<number>, angleRad: number): PathModifier => {
            return (existingDirectives: DD2<any>[]) => {
                return appendMutatedCopy(existingDirectives, (dir) => dir.getMirroredCustom(axisOffset, angleRad));
            }
        },
    },

    Array: (direction: vec2<number>, spacing: number, count: uint32) => {
        return (existingDirectives: DD2<any>[]) => {
            const newDirectives: DD2<any>[] = existingDirectives;
            for (let i = 0; i < count; i++) {
                const offset: vec2<number> = [
                    direction[0] * spacing * i,
                    direction[1] * spacing * i
                ];
                for (const dir of existingDirectives) {
                    newDirectives.push(dir.applyConstantOffset(offset));
                }
            }
            return newDirectives;
        }
    }
    
        
} as const;
