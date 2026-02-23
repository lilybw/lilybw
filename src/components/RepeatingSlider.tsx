import { Component, JSX } from "solid-js";

interface RepeatingSliderProps {
  paneContent: JSX.Element;
  parentStyle?: JSX.CSSProperties;
  durationS?: number; // Duration for one full slide cycle in seconds
}

export const RepeatingSlider: Component<RepeatingSliderProps> = (props) => {
  const duration = () => props.durationS || 5; // Default to 5 seconds

  return (
    <div
      class="repeating-slider-container"
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        position: "relative",
        ...(props.parentStyle || {}),
      }}
    >
      <div
        class="repeating-slider-pane"
        style={{
          position: "absolute",
          display: "flex",
          animation: `slide ${duration()}s linear infinite`,
          height: "100%",
          width: "200%",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            width: "50%",
            height: "100%",
            "flex-shrink": "0",
          }}
        >
          {props.paneContent}
        </div>
        <div
          style={{
            position: "absolute",
            left: "50%",
            width: "50%",
            height: "100%",
            "flex-shrink": "0",
          }}
        >
          {props.paneContent}
        </div>
      </div>
      <style>{`
                @keyframes slide {
                    0% {
                        left: 0%;
                    }
                    100% {
                        left: -100%;
                    }
                }
            `}</style>
    </div>
  );
};
