import _ from "../../theme/tokens.js";

export default function Skeleton({ width = "100%", height = 16, radius = _.rSm, style }) {
  return (
    <div style={{
      width, height, borderRadius: radius, background: _.well,
      animation: "shimmer 1.5s infinite", ...style,
    }}>
      <style>{`@keyframes shimmer{0%{opacity:1}50%{opacity:0.5}100%{opacity:1}}`}</style>
    </div>
  );
}
