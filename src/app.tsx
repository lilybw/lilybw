import { createEffect, createSignal, onCleanup } from "solid-js";
import "./app.css";
import { CSSProperty } from "./util/animationUtil";
import { MenuBar } from "./components/MenuBar";
import { Path, SVG } from "./util/svgUtil";

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
      {SVG([Path.M(0, 0), Path.L(100, 100)], {
        attributes: { 
          stroke: "red", 
          "stroke-width": 2,
          style: "position: absolute; top: 50%; left: 50%; width: 30%; height: 30%; pointer-events: none;"
        },
        modifiers: [
          Path.Modifier.Mirror.Y(), 
          Path.Modifier.Mirror.X(),
          Path.Modifier.Array([0,-1], 10, 5)
        ]
      })
      }
    </main>
  );
}
