import { useState, useEffect, useRef } from "react";
import _ from "../../theme/tokens.js";
import { input as inputStyle } from "../../theme/styles.js";
import { Search } from "lucide-react";

export default function SearchInput({ value, onChange, placeholder = "Search\u2026", debounce = 200, style }) {
  const [local, setLocal] = useState(value || "");
  const timer = useRef(null);

  useEffect(() => { setLocal(value || ""); }, [value]);

  const handleChange = e => {
    const v = e.target.value;
    setLocal(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => onChange(v), debounce);
  };

  return (
    <div style={{ position: "relative", ...style }}>
      <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: _.muted, pointerEvents: "none" }} />
      <input
        style={{ ...inputStyle, paddingLeft: 34 }}
        value={local}
        onChange={handleChange}
        placeholder={placeholder}
      />
    </div>
  );
}
