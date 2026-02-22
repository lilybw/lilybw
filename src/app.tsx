import { Accessor, createEffect, createSignal, JSX, onCleanup } from "solid-js";
import "./app.css";
import "./util/style/utility.css";
import { CSSProperty } from "./util/animationUtil";
import { MenuBar } from "./components/MenuBar";
import { SVG, Path } from "./util/svg/entrypoint";
import { LinearGradient } from "./util/svg/linearGradient";
import { ClipPath } from "./util/svg/clipPath";
import SunRays from "./components/SunRays";

const MainPageIndex = 0;

export default function App() {
  const [pageIndex, setPageIndex] = createSignal(1);

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
    }
  });

  return (
    <main>
      <div class="site-background"></div>
      <SunRays mvmtFrequencyMultiplier={0.2} numRays={40}/>
      <h1 class={`
        page-title-purple 
        page-title-position 
        ${pageIndex() !== MainPageIndex ? "page-title-reduced" : ""}`}
        >Kaisa
      </h1>
      <h1 class={`
          page-title-purple 
          page-title-position 
          page-title-surname-adjustment 
          ${pageIndex() !== MainPageIndex ? "page-title-reduced" : ""}`}>
        Wanscher
      </h1>
      <div class="chevy-container" style={ resolveNavChevyContainerStyle(pageIndex) }>
        {Chevy(
          [Path.L(20, 10), Path.L(40, 0), Path.L(35, 0), Path.L(20, 7), Path.L(5, 0)], 
          { htmlAttributes: (defs) => ({ 
              fill: defs.testGradient3,
              onClick: () => setPageIndex(prev => prev + 1)
            }),
            modifiers: [ (pageIndex() != 0 ? Path.Modifier.Mirror.Y : Path.Modifier.NO_OP)() ] 
          })
        }
        {Chevy(
          [Path.L(20, 10), Path.L(40, 0), Path.L(35, 0), Path.L(20, 7), Path.L(5, 0)], 
          { htmlAttributes: (defs) => ({ 
              fill: defs.testGradient3,
              onClick: () => setPageIndex(prev => prev - 1)
            }),
            modifiers: [ ] 
          })
        }
      </div>
      <h1 class={`page-index-label break-all ${pageIndex() == 0 ? `invisible` : ""}`}>{pageIndex()}</h1>
    </main>
  );
}

const resolveNavChevyContainerStyle = (pageIndex: Accessor<number>): JSX.CSSProperties => {
  let style: JSX.CSSProperties = { 
  };
  if (pageIndex() == 0) {
    return style;
  } 
  style.bottom = `50%`;
  style.transform = `translateY(-50%)`;

  return style;
}
