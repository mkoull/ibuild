import _ from "../../theme/tokens.js";

export default function Badge({ color, children, onClick }) {
  const style = {
    fontSize: _.fontSize.caption, fontWeight: _.fontWeight.semi, padding: "3px 10px", borderRadius: _.rFull,
    background: `${color}14`, color,
    cursor: onClick ? "pointer" : "default",
  };
  return <span style={style} onClick={onClick}>{children}</span>;
}
