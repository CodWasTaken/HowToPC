export type MobileWorkspaceView = "PARTS" | "TWIN" | "BUILD";

interface WorkspaceNavigationProps {
  leftDrawerOpen: boolean;
  rightDrawerOpen: boolean;
  mobileView: MobileWorkspaceView;
  onToggleParts: () => void;
  onShowTwin: () => void;
  onToggleBuild: () => void;
  onMobileView: (view: MobileWorkspaceView) => void;
}

export function WorkspaceNavigation(props: WorkspaceNavigationProps) {
  const views: MobileWorkspaceView[] = ["PARTS", "TWIN", "BUILD"];
  return (
    <nav className="workspace-navigation" aria-label="Workspace panels">
      <div className="drawer-navigation">
        <button className={props.leftDrawerOpen ? "active" : ""} onClick={props.onToggleParts}>Parts</button>
        <button onClick={props.onShowTwin}>Twin</button>
        <button className={props.rightDrawerOpen ? "active" : ""} onClick={props.onToggleBuild}>Build</button>
      </div>
      <div className="mobile-navigation">
        {views.map((view) => (
          <button key={view} className={props.mobileView === view ? "active" : ""} onClick={() => props.onMobileView(view)}>
            {view[0]}{view.slice(1).toLowerCase()}
          </button>
        ))}
      </div>
    </nav>
  );
}
