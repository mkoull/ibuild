import { Hammer } from "lucide-react";
import Empty from "./Empty.jsx";

export default function LockedState({ onConvert }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 420, padding: 24 }}>
      <div style={{ width: "min(560px, 100%)" }}>
        <Empty
          icon={Hammer}
          title="Convert to Job to unlock this area"
          text="This area becomes available once the project is converted into an active job so delivery workflows can run against an active lifecycle."
          action={onConvert}
          actionText="Convert to Job"
        />
      </div>
    </div>
  );
}
