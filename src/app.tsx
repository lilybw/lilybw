import { createEffect, createSignal, onCleanup } from "solid-js";
import "./app.css";
import { CSSProperty } from "./util/animationUtil";
import { MenuBar } from "./components/MenuBar";
import { SVG, Path } from "./util/svg/entrypoint";
import { LinearGradient } from "./util/svg/linearGradient";

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

  return (
    <main>
      <div class="site-background"></div>
      <h1 class="page-title-aqua-marine">ABSOLUTELY NOT KDA</h1>
      <MenuBar />
      {SVG({ 
        htmlAttributes: { 
          style: "position: absolute; left: 50%; top: 50%; width: 100%; height: 100%; transform: translate(-50%, -50%);"  
        }, 
        defs: {
          testGradient: new LinearGradient(
            'black', 'white'
          ).options({ direction: 45 }),
          testGradient2: new LinearGradient(
            'white', 'black'
          ).options({ direction: 135 }),
          hvadSomHelst: null as any
        }
      })(
        [ Path.Rect(-20, -20, 20, 40), Path.Rect(10, 0, 20, 40), Path.Ellipse(0, 0, 10, 20) ], 
        { modifiers: [
          //Path.Modifier.Array([1, 0], 10, 5)
          ],
           htmlAttributes: (defs) => ({
            stroke: defs.testGradient2,
            fill: defs.testGradient
           })
        }
      )}
      {SVG()(
        [ Path.M(-10, -10), Path.L(10, 10), Path.L(-10, 10), Path.E() ],
        { htmlAttributes: { stroke: "red", fill: "transparent", "stroke-width": 0.5 } }
      )}
    </main>
  );
}
