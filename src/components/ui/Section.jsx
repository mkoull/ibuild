import Card from "./Card.jsx";

export default function Section({ children, style, cardStyle, ...rest }) {
  return (
    <Card
      style={{
        animation: "fadeUp 0.2s ease",
        marginBottom: 24,
        ...cardStyle,
      }}
      {...rest}
    >
      <div style={style}>{children}</div>
    </Card>
  );
}
