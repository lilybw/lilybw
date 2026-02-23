import "./SunRays.css";
import { createEffect, createSignal, onCleanup } from "solid-js";
import { CSSProperty } from "../util/animationUtil";
import type { JSX } from "solid-js";

interface SunRaysProps {
  numRays?: number;
  mvmtFrequencyMultiplier?: number;
}

export default function SunRays(props: SunRaysProps) {
  /*
    createEffect(() => {
        const drivers = new Array(props.numRays ?? 12).fill(0).map((_, i) => 
            CSSProperty({name: `--sun-ray-${i}-driver`, target: document.documentElement})
                .oscillate(-1, 1, 0.5 + i * 0.05)
        );
        
        onCleanup(() => {
          drivers.forEach(cleanUp => cleanUp());
        })
    })
    */

  return (
    <div class="sun-rays">
      {new Array(props.numRays ?? 12).fill(0).map((_, i) => (
        <div class="sun-ray" style={computeRayStyle(i, props)}></div>
      ))}
    </div>
  );
}

const computeRayStyle = (
  index: number,
  settings: SunRaysProps,
): JSX.CSSProperties => {
  settings.mvmtFrequencyMultiplier = settings.mvmtFrequencyMultiplier ?? 1;
  settings.numRays = settings.numRays ?? 12;

  const rayMovementFrequency =
    (Math.random() - 0.5) * 2 * settings.mvmtFrequencyMultiplier; // in Hz
  const baseLROffset = 200 / settings.numRays + 100;
  const computedLROffset = `
        calc(
            sin(
                var(--site-elapsed-seconds) * ${rayMovementFrequency}
                + ${index}
            ) * 150vw 
            - ${baseLROffset}vw
        )`;
  const computedRotation = `
        rotate(
            calc(
                var(--site-breath-driver) * ${settings.mvmtFrequencyMultiplier} * 20deg
            )
        )`;
  const rayWidth = Math.random() * 5 + 5; // in vw, since the container is 400vw wide
  let rayColor = `white`;
  switch (index % 4) {
    case 0:
      rayColor = `hsl(200, calc(50% * var(--bg-saturation-multiplier)), calc(80% * var(--bg-lightness-multiplier)))`;
      break;
    case 1:
      rayColor = `hsl(250, calc(50% * var(--bg-saturation-multiplier)), calc(80% * var(--bg-lightness-multiplier)))`;
      break;
    case 3:
      rayColor = `hsl(250, calc(50% * var(--bg-saturation-multiplier)), calc(80% * var(--bg-lightness-multiplier)))`;
      break;
    default:
      rayColor = `hsl(0, 0%, 100%)`;
      break;
  }
  const computedBackground = `linear-gradient(
            -56deg, 
            transparent ${50 - rayWidth / 2}%, 
            ${rayColor}, 
            transparent ${50 + rayWidth / 2}%
        )`;

  return {
    left: computedLROffset,
    top: `-100%`,
    background: computedBackground,
    "transform-origin": "top right",
    transform: computedRotation,
  };
};
/*
  --main-bg-gradient-stop-01: hsl(200, calc(50% * var(--bg-saturation-multiplier)), calc(80% * var(--bg-lightness-multiplier)));
  --main-bg-gradient-stop-02: hsl(250, calc(50% * var(--bg-saturation-multiplier)), calc(80% * var(--bg-lightness-multiplier)));
  --main-bg-gradient-stop-03: hsl(0, 0%, 100%);
  --main-bg-gradient-stop-04: hsl(0, calc(50% * var(--bg-saturation-multiplier)), calc(80% * var(--bg-lightness-multiplier)));
*/
