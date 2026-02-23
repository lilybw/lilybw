import { JSX } from "solid-js";
import "./MenuBar.css";

interface MenuBarProps {}

export function MenuBar(props: MenuBarProps) {
  return (
    <div class="menu-bar">
      <div style={{ display: "flex", gap: ".5rem", "flex-direction": "row" }}>
        <h2 class="menu-bar-button">Projects</h2>
        <h2 class="menu-bar-button">Projects</h2>
        <h2 class="menu-bar-button">Projects</h2>
      </div>
    </div>
  );
}
