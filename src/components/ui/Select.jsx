import _ from "../../theme/tokens.js";
import { label as labelStyle, input as inputStyle } from "../../theme/styles.js";

export default function Select({ label, value, onChange, options = [], placeholder, style, ...rest }) {
  return (
    <div style={style}>
      {label && <label style={labelStyle}>{label}</label>}
      <select
        value={value}
        onChange={onChange}
        style={{ ...inputStyle, cursor: "pointer" }}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => {
          const val = typeof o === "string" ? o : o.value;
          const lbl = typeof o === "string" ? o : o.label;
          return <option key={val} value={val}>{lbl}</option>;
        })}
      </select>
    </div>
  );
}
