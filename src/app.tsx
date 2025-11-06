import { createEffect, createSignal, onCleanup } from "solid-js";
import "./app.css";
import { CSSProperty } from "./util/animationUtil";
import { MenuBar } from "./components/MenuBar";
import { SVG, Path } from "./util/svg/entrypoint";

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
      {SVG()([Path.M(0, 0), Path.L(50, 0), Path.L(75, -50)], {
        attributes: { 
          color: "red", 
          "stroke-width": 10,
          style: "position: absolute; top: 50%; left: 50%; width: 30%; height: 30%; pointer-events: none;"
        },
        modifiers: [
          //Path.Modifier.Mirror.Y(), 
          Path.Modifier.Array([5,0], 10, 1)
        ]
      })
      }
    </main>
  );
}
