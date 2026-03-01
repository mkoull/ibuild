import _ from "../../theme/tokens.js";

export default function Badge({ color, children, onClick }) {
  const style = {
    fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: _.rFull,
    background: `${color}14`, color,
    cursor: onClick ? "pointer" : "default",
  };
  return <span style={style} onClick={onClick}>{children}</span>;
}
