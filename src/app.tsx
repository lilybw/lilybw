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
      {SVG({ attributes: { 
        style: "position: absolute; left: 50%; top: 50%; width: 20%; height: 20%;" 
      } })(
        [ Path.M(-20, 0), Path.L(20,0), Path.L(35, 20), Path.L(35, 40) ], 
        { modifiers: [
          Path.Modifier.Mirror.Y(),
          Path.Modifier.Array([1, 0], 10, 5)
          ],
           
        }
      )}
    </main>
  );
}
