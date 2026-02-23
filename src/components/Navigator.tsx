import { Path, SVG } from "~/util/svg/entrypoint";
import "./Navigator.css";
import {
  createSignal,
  createEffect,
  onCleanup,
  Accessor,
  JSX,
  Setter,
} from "solid-js";
import { LinearGradient } from "~/util/svg/linearGradient";

interface NavigatorProps {
  pageIndex: Accessor<number>;
  setPageIndex: Setter<number>;
}

export default function Navigator(props: NavigatorProps) {
  const Chevy = SVG("chevy", {
    defs: {
      gradient: new LinearGradient(
        "hsl(0, 80%, 50%)",
        "hsl(0, 40%, 50%)",
        "hsl(0, 80%, 50%)",
      ),
    },
  });

  const [upHover, setUpHover] = createSignal(false);
  const [downHover, setDownHover] = createSignal(false);
  const [scrollValue, setScrollValue] = createSignal(0);

    let activityClearTimeout: number | undefined = undefined;

    const onWheelScroll = (e: WheelEvent) => {
      setScrollValue((prev) => prev + e.deltaY);
      if (activityClearTimeout) {
        clearTimeout(activityClearTimeout);
      }
      activityClearTimeout = setTimeout(() => {
        if (Math.abs(scrollValue()) > 200) {
          props.setPageIndex((prev) =>
            Math.max(0, prev + (scrollValue() > 0 ? 1 : -1)),
          );
          console.log("Page index changed to", props.pageIndex());
        }
        setScrollValue(0);
      }, 300);
    };

    const goUp = () => {
        props.setPageIndex((prev) => Math.max(0, prev - 1));
    };

    const goDown = () => {
        props.setPageIndex((prev) => prev + 1);
    };

  createEffect(() => {
    document.documentElement.addEventListener("wheel", onWheelScroll);

    onCleanup(() => {
        document.documentElement.removeEventListener("wheel", onWheelScroll);
      if (activityClearTimeout) {
        clearTimeout(activityClearTimeout);
      }
    });
  });

  return (
    <>
      <div
        class="chevy-container"
        style={resolveNavChevyContainerStyle(props.pageIndex)}
      >
        <div
          class="ease-p3"
          style={
            props.pageIndex() !== 0 ? { rotate: `180deg` } : { rotate: `0deg` }
          }
        >
          {Chevy(
            [
              Path.L(20, 10),
              Path.L(40, 0),
              Path.L(35, 0),
              Path.L(20, 7),
              Path.L(5, 0),
            ],
            {
              htmlAttributes: (defs) => ({
                fill: defs.gradient,
                onClick: goUp,
              }),
            },
          )}
        </div>
        {Chevy(
          [
            Path.L(20, 10),
            Path.L(40, 0),
            Path.L(35, 0),
            Path.L(20, 7),
            Path.L(5, 0),
          ],
          {
            htmlAttributes: (defs) => ({
              fill: defs.gradient,
              onClick: goDown,
              style: (downHover() ? { "filter": `drop-shadow(0 0 0.75rem hsl(0, 80%, 50%))` } : {}),
            }),
          },
        )}
      </div>
      <h1
        class={`page-index-label break-all ${props.pageIndex() == 0 ? `invisible` : ""}`}
      >
        {props.pageIndex()}
      </h1>
      {props.pageIndex() != 0 && (
        <>
          <div
            class="navigator-helper navigator-helper-up"
            aria-roledescription="button"
            onMouseEnter={() => setUpHover(true)}
            onMouseLeave={() => setUpHover(false)}
            onClick={goUp}
          />
          <div
            class="navigator-helper navigator-helper-down"
            aria-roledescription="button"
            onMouseEnter={() => setDownHover(true)}
            onMouseLeave={() => setDownHover(false)}
            onClick={goDown}
          />
        </>
      )}
    </>
  );
}

const resolveNavChevyContainerStyle = (
  pageIndex: Accessor<number>,
): JSX.CSSProperties => {
  let style: JSX.CSSProperties = {};
  if (pageIndex() == 0) {
    return style;
  }
  style.bottom = `calc(50vh - 6.25rem)`;
  style.transform = `translateY(-50%)`;
  style["row-gap"] = `4rem`;

  return style;
};
