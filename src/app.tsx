import { createEffect, createSignal, onCleanup } from "solid-js";
import "./app.css";
import { CSSProperty } from "./util/animationUtil";
import { MenuBar } from "./components/MenuBar";
import { SVG, Path } from "./util/svg/entrypoint";
import { LinearGradient } from "./util/svg/linearGradient";
import { ClipPath } from "./util/svg/clipPath";
import SunRays from "./components/SunRays";

const MainPageIndex = 0;

export default function App() {
  const [pageIndex, setPageIndex] = createSignal(0);

  createEffect(() => {
    const clearSiteBreath = CSSProperty({name: "--site-breath-driver", target: document.documentElement})
      .oscillate(-1, 1, 0.25);

    const clearSiteElapsedSeconds = CSSProperty({name: "--site-elapsed-seconds", target: document.documentElement})
      .asFunctionOfElapsedTimeS((elapsedS) => elapsedS);

    let activityClearTimeout: number | undefined = undefined;
    let scrollValue = 0;
    document.documentElement.addEventListener("wheel", (e: WheelEvent) => {
      scrollValue += e.deltaY;
      if (activityClearTimeout) {
        clearTimeout(activityClearTimeout);
      }
      activityClearTimeout = setTimeout(() => {
        if (Math.abs(scrollValue) > 200) {
          setPageIndex( (prev) => Math.max(0, prev + (scrollValue > 0 ? 1 : -1)) );
          console.log("Page index changed to", pageIndex());
        }
        scrollValue = 0;
      }, 300);
    })
    
    onCleanup(() => {
      clearSiteBreath();
      clearSiteElapsedSeconds();
    })
  })

  const Chevy = SVG("chevy", { defs: {
      testGradient3: new LinearGradient( 'hsl(0, 80%, 50%)', 'hsl(0, 40%, 50%)', 'hsl(0, 80%, 50%)' ),
  }});

  return (
    <main>
      <div class="site-background"></div>
      <SunRays mvmtFrequencyMultiplier={0.2} numRays={40}/>
      <h1 class={`page-title-purple page-title-position ${pageIndex() !== MainPageIndex ? "page-title-reduced" : ""}`}>Kaisa</h1>
      <h1 class={`page-title-purple page-title-position page-title-surname-adjustment ${pageIndex() !== MainPageIndex ? "page-title-reduced" : ""}`}>Wanscher</h1>
      {Chevy(
        [Path.L(20, 10), Path.L(40, 0), Path.L(35, 0), Path.L(20, 7), Path.L(5, 0)], 
        { htmlAttributes: (defs) => ({ 
            fill: defs.testGradient3
          }),
          modifiers: [ Path.Modifier.Array([0, 1], 7, 2) ] 
        })
      }
    </main>
  );
}

/*

      {svgDef(
        [ Path.M(20,0), Path.L(80,0), Path.L(100,20), Path.L(100,80), Path.L(80,100), Path.L(20,100), Path.L(0,80), Path.L(0,20), Path.L(20,0) ], 
        { 
          htmlAttributes: (defs) => ({
            stroke: defs.testGradient2,
            fill: defs.testGradient,
            "stroke-width": 1.5,
          })
        },
      )}
      {svgDef(
        [ Path.M(5,5), Path.L(95,5), Path.L(100,20), Path.L(100,80), Path.L(80,100), Path.L(20,100), Path.L(0,80), Path.L(0,20), Path.L(5,5) ],
        {
          htmlAttributes: (defs) => ({
            stroke: defs.testGradient3,
            fill: "transparent",
            "stroke-width": 0.5,
          })
        }
      )}

*/