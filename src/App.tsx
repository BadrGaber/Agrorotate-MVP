import React, { Suspense, lazy, useEffect, useRef, useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import { AppShell } from "./app/AppShell";
import { useRoute, useRouteFocus, type RouteKey } from "./app/router";
import { WorkspaceProvider } from "./state/workspace";
import { ProofProvider } from "./ui/proof";
import { playRouteSound } from "./ui/sound";
import { FieldPage } from "./pages/FieldPage";
import { SoilPage } from "./pages/SoilPage";
import { WaterPage } from "./pages/WaterPage";
import { PrioritiesPage } from "./pages/PrioritiesPage";
import { PlanPage } from "./pages/PlanPage";
import { SetupGate } from "./pages/shared";



const PreviewPlayer = lazy(() =>
  import("./components/PreviewPlayer").then((module) => ({
    default: module.PreviewPlayer,
  })),
);



const FarmerWebsiteLanding = React.lazy(() =>
  import("./components/FarmerWebsiteLanding").then((module) => ({
    default: module.FarmerWebsiteLanding,
  })),
);
const CropsPage = React.lazy(() =>
  import("./pages/CropsPage").then((module) => ({ default: module.CropsPage })),
);
const EvidencePage = React.lazy(() =>
  import("./pages/EvidencePage").then((module) => ({ default: module.EvidencePage })),
);
const MethodPage = React.lazy(() =>
  import("./pages/MethodPage").then((module) => ({ default: module.MethodPage })),
);
const SourcesPage = React.lazy(() =>
  import("./pages/SourcesPage").then((module) => ({ default: module.SourcesPage })),
);

function PageLoading() {
  return (
    <main className="page">
      <div className="empty" style={{ marginTop: 40 }}>
        <span className="spin" />
        <div className="empty__title">Opening the evidence record…</div>
      </div>
    </main>
  );
}

export function App() {
  const [route, navigate] = useRoute();
  const focus = useRouteFocus();

  /**
   * A proof link (`#/water?focus=…`) is a read-only inspection of a page, so
   * it must not be bounced to step one. Normal navigation keeps the gate.
   */
  const gated = (current: RouteKey, node: React.ReactNode) =>
    focus ? (
      node
    ) : (
      <SetupGate current={current} navigate={navigate}>
        {node}
      </SetupGate>
    );


  const [previewOpen, setPreviewOpen] = useState(false);
  const lastRoute = useRef(route);


  useEffect(() => {
    if (lastRoute.current === route) return;
    lastRoute.current = route;
    playRouteSound();
  }, [route]);

  const page =
    route === "field" ? (
      <FieldPage navigate={navigate} />
    ) : route === "soil" ? (
      gated("soil", <SoilPage navigate={navigate} />)
    ) : route === "water" ? (
      gated("water", <WaterPage navigate={navigate} />)
    ) : route === "priorities" ? (
      gated("priorities", <PrioritiesPage navigate={navigate} />)
    ) : route === "plan" ? (
      gated("plan", <PlanPage navigate={navigate} />)
    ) : route === "crops" ? (
      <CropsPage />
    ) : route === "evidence" ? (
      <EvidencePage />
    ) : route === "sources" ? (
      <SourcesPage />
    ) : (
      <MethodPage />
    );

  return (
    <WorkspaceProvider>
      <ProofProvider>
        {route === "landing" ? (
          <Suspense fallback={<PageLoading />}>
            <FarmerWebsiteLanding
              onEnterDashboard={() => navigate("field")}
              onStartPreview={() => setPreviewOpen(true)}
              onNavigate={navigate}
            />
          </Suspense>
        ) : (
          <AppShell
            route={route}
            navigate={navigate}
            onStartPreview={() => setPreviewOpen(true)}
          >
            <Suspense fallback={<PageLoading />}>{page}</Suspense>
          </AppShell>
        )}
      </ProofProvider>

      {previewOpen && (
        <Suspense fallback={null}>
          <PreviewPlayer
            navigate={navigate}
            onClose={() => setPreviewOpen(false)}
          />
        </Suspense>
      )}

      <Analytics />
    </WorkspaceProvider>
  );
}

export default App;
