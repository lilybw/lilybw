import { createSignal } from "solid-js";
import "./app.css";

export default function App() {
  const [count, setCount] = createSignal(0);

  return (
    <main>
      <h1 class="page-title-golden">Hello world!</h1>
      <button class="increment" onClick={() => setCount(count() + 1)} type="button">
        Clicks: {count()}
      </button>
      <p>
        Visit{" "}
        <a href="https://start.solidjs.com" target="_blank">
          start.solidjs.com
        </a>{" "}
        to learn how to build SolidStart apps.
      </p>
      <div class="color-dodge-all tenbyten"
        style="
            background-color: hsl(0, 0%, 20%);
            width: 100%;
            mix-blend-mode: difference;
            "
      ></div>
    </main>
  );
}
