import type { TwinView } from "@/lib/twin-camera";

interface TwinToolbarProps {
  view: TwinView;
  caseVisible: boolean;
  onView: (view: TwinView) => void;
  onFit: () => void;
  onToggleCase: () => void;
}

export function TwinToolbar({ view, caseVisible, onView, onFit, onToggleCase }: TwinToolbarProps) {
  const views: { id: TwinView; label: string }[] = [
    { id: "ISO", label: "Iso" },
    { id: "FRONT", label: "Front" },
    { id: "SIDE", label: "Side" },
    { id: "TOP", label: "Top" },
  ];
  return (
    <div className="twin-toolbar" aria-label="Digital twin camera controls">
      {views.map((item) => (
        <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => onView(item.id)}>{item.label}</button>
      ))}
      <button onClick={onFit}>Fit</button>
      <button className={caseVisible ? "active" : ""} onClick={onToggleCase}>Case</button>
    </div>
  );
}
