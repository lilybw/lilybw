import { appendMutatedCopy } from "../arrayUtil";
import { PathModifier, DrawDirective, vec2, uint32 } from "./types";

export const _PathModifiers = {
  CopyAnd: (mutator: PathModifier): PathModifier => {
    return (existingDirectives: DrawDirective<any>[]) => {
      return [...existingDirectives, ...mutator(existingDirectives)];
    };
  },

  NO_OP: (): PathModifier => {
    return (dirs) => dirs;
  },

  Mirror: {
    X: (): PathModifier => {
      return (existingDirectives: DrawDirective<any>[]) => {
        return existingDirectives.map((dir) => dir.getMirroredOnX());
      };
    },
    Y: (): PathModifier => {
      return (existingDirectives: DrawDirective<any>[]) => {
        return existingDirectives.map((dir) => dir.getMirroredOnY());
      };
    },
    Angle: (angleRad: number): PathModifier => {
      return (existingDirectives: DrawDirective<any>[]) => {
        return existingDirectives.map((dir) =>
          dir.getMirroredCustom([0, 0], angleRad),
        );
      };
    },
    Custom: (axisOffset: vec2<number>, angleRad: number): PathModifier => {
      return (existingDirectives: DrawDirective<any>[]) => {
        return existingDirectives.map((dir) =>
          dir.getMirroredCustom(axisOffset, angleRad),
        );
      };
    },
  },

  Array: (direction: vec2<number> | number, spacing: number, count: uint32) => {
    if (typeof direction === "number") {
      const angleRad = direction * (Math.PI / 180);
      direction = [Math.cos(angleRad), Math.sin(angleRad)];
    }

    return (existingDirectives: DrawDirective<any>[]) => {
      const newDirectives: DrawDirective<any>[] = [...existingDirectives];
      for (let i = 0; i < count; i++) {
        const offset: vec2<number> = [
          direction[0] * spacing * i,
          direction[1] * spacing * i,
        ];
        for (const dir of existingDirectives) {
          newDirectives.push(dir.applyConstantOffset(offset));
        }
      }
      return newDirectives;
    };
  },

  Bevel: (): PathModifier => {
    return (existingDirectives: DrawDirective<any>[]) => {
      for (const dir of existingDirectives) {
      }
      return existingDirectives; //TODO
    };
  },
} as const;
