import _ from "../../theme/tokens.js";
import { label as labelStyle, input as inputStyle } from "../../theme/styles.js";

export default function Input({ label, value, onChange, error, placeholder, type = "text", style, inputStyle: is, ...rest }) {
  return (
    <div style={style}>
      {label && <label style={labelStyle}>{label}</label>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{ ...inputStyle, ...(error ? { borderColor: _.red } : {}), ...is }}
        {...rest}
      />
      {error && <div style={{ fontSize: _.fontSize.caption, color: _.red, marginTop: 3 }}>{error}</div>}
    </div>
  );
}
