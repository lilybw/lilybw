import { createEffect, createSignal, onCleanup } from "solid-js";
import "./app.css";
import { CSSProperty } from "./util/animationUtil";
import { MenuBar } from "./components/MenuBar";
import { SVG, Path } from "./util/svg/entrypoint";
import { LinearGradient } from "./util/svg/linearGradient";
import { ClipPath } from "./util/svg/clipPath";

export default function App() {

  createEffect(() => {
    const clearSiteBreath = CSSProperty({name: "--site-breath-driver", target: document.documentElement})
      .oscillate(-1, 1, 0.25);

    const clearSiteElapsedSeconds = CSSProperty({name: "--site-elapsed-seconds", target: document.documentElement})
      .asFunctionOfElapsedTimeS((elapsedS) => elapsedS);
    
    onCleanup(() => {
      clearSiteBreath();
      clearSiteElapsedSeconds();
    })
  })

  const svgDef = SVG("site-svg-background", { 
    defs: {
      testGradient: new LinearGradient( 'black', 'white' ),
      testGradient2: new LinearGradient( 'white', 'black' ),
      clipPath: new ClipPath(Path.Ellipse(-5,0,10,10))
    }
  });

  return (
    <main>
      <div class="site-background"></div>
      <h1 class="page-title-aqua-marine">ABSOLUTELY NOT KD/A</h1>
      <MenuBar />
      {svgDef(
        [ Path.Rect(-20, -20, 20, 40) ], 
        { 
          htmlAttributes: (defs) => ({
            stroke: defs.testGradient2,
            fill: defs.testGradient,
            "clip-path": defs.clipPath
          })
        },
      )}
    </main>
  );
}
