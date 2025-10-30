import { createEffect, createSignal, onCleanup } from "solid-js";
import "./app.css";
import { CSSProperty } from "./util/animationUtil";
import { RepeatingSlider } from "./components/RepeatingSlider";

export default function App() {

  createEffect(() => {
    const clearSiteBreath = CSSProperty({name: "--site-breath-driver", target: document.documentElement})
      .oscillate(0, 2, 0.25);

    const clearSiteElapsedSeconds = CSSProperty({name: "--site-elapsed-seconds", target: document.documentElement})
      .asFunctionOfElapsedTimeS((elapsedS) => elapsedS);
    
    onCleanup(() => {
      clearSiteBreath();
      clearSiteElapsedSeconds();
    })
  })

  const siteBackground = <div class="site-background"></div>;

  return (
    <main>
      <RepeatingSlider durationS={30} paneContent={siteBackground} parentStyle={{height: "100vh", position: "absolute", top: 0, left: 0}}/>
      <h1 class="page-title-purple">Hello world!</h1>
    </main>
  );
}
