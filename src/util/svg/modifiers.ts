import { mirrorDirectivesX, mirrorDirectivesOnY } from "./svgUtil"
import { PathModifier, DD2, vec2, uint32, DrawDirective } from "./types"

export const _PathModifiers = {

    Mirror: {
        X: (): PathModifier => {
            return (existingDirectives: DD2<any>[]) => {
                return [...existingDirectives, ...mirrorDirectivesX(existingDirectives)]
            }
        },
        Y: (): PathModifier => {
            return (existingDirectives: DD2<any>[]) => {
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
