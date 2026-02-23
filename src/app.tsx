import { Accessor, createEffect, createSignal, JSX, onCleanup } from "solid-js";
import "./app.css";
import "./util/style/utility.css";
import { CSSProperty } from "./util/animationUtil";
import { MenuBar } from "./components/MenuBar";
import { SVG, Path } from "./util/svg/entrypoint";
import { LinearGradient } from "./util/svg/linearGradient";
import { ClipPath } from "./util/svg/clipPath";
import SunRays from "./components/SunRays";
import Navigator from "./components/Navigator";

const MainPageIndex = 0;

export default function App() {
  const [pageIndex, setPageIndex] = createSignal(1);

  createEffect(() => {
    const clearSiteBreath = CSSProperty({
      name: "--site-breath-driver",
      target: document.documentElement,
    }).oscillate(-1, 1, 0.25);

    const clearSiteElapsedSeconds = CSSProperty({
      name: "--site-elapsed-seconds",
      target: document.documentElement,
    }).asFunctionOfElapsedTimeS((elapsedS) => elapsedS);

    onCleanup(() => {
      clearSiteBreath();
      clearSiteElapsedSeconds();
    });
  });

  return (
    <main>
      <div class="site-background"></div>
      <SunRays mvmtFrequencyMultiplier={0.2} numRays={40} />
      <h1
        class={`
        page-title-purple 
        page-title-position 
        ${pageIndex() !== MainPageIndex ? "page-title-reduced" : ""}`}
      >
        Kaisa
      </h1>
      <h1
        class={`
          page-title-purple 
          page-title-position 
          page-title-surname-adjustment 
          ${pageIndex() !== MainPageIndex ? "page-title-reduced" : ""}`}
      >
        Wanscher
      </h1>
      <Navigator pageIndex={pageIndex} setPageIndex={setPageIndex} />
    </main>
  );
}
