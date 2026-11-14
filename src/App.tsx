import React, { Suspense, lazy, useEffect, useRef, useState } from "react";
import { AppShell } from "./app/AppShell";
import { useRoute } from "./app/router";
import { WorkspaceProvider } from "./state/workspace";
import { ProofProvider } from "./ui/proof";
import { playRouteSound } from "./ui/sound";
import { FieldPage } from "./pages/FieldPage";
import { SoilPage } from "./pages/SoilPage";
import { WaterPage } from "./pages/WaterPage";
import { PrioritiesPage } from "./pages/PrioritiesPage";
import { PlanPage } from "./pages/PlanPage";
import { SetupGate } from "./pages/shared";

// The five-step preview is lazy: it only loads when opened. It renders at the
// app level (above AppShell) so the dialog can overlay the landing page too.
const PreviewPlayer = lazy(() =>
  import("./components/PreviewPlayer").then((module) => ({
    default: module.PreviewPlayer,
  })),
);

// All content is live and evidence-grounded. The landing page introduces the
// product; the preview is a read-only walkthrough, not a separate app mode.
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
  // The preview never starts by itself. The landing page offers both paths
  // side by side, and the top bar can replay it at any time.
  const [previewOpen, setPreviewOpen] = useState(false);
  const lastRoute = useRef(route);

  // A quiet transition cue for real navigation. The initial route is silent.
  useEffect(() => {
    if (lastRoute.current === route) return;
    lastRoute.current = route;
    playRouteSound();
  }, [route]);

  const page =
    route === "field" ? (
      <FieldPage navigate={navigate} />
    ) : route === "soil" ? (
      <SetupGate current="soil" navigate={navigate}>
        <SoilPage navigate={navigate} />
      </SetupGate>
    ) : route === "water" ? (
      <SetupGate current="water" navigate={navigate}>
        <WaterPage navigate={navigate} />
      </SetupGate>
    ) : route === "priorities" ? (
      <SetupGate current="priorities" navigate={navigate}>
        <PrioritiesPage navigate={navigate} />
      </SetupGate>
    ) : route === "plan" ? (
      // The plan is the last step: every setup page must be complete first.
      <SetupGate current="plan" navigate={navigate}>
        <PlanPage navigate={navigate} />
      </SetupGate>
    ) : route === "crops" ? (
      <CropsPage navigate={navigate} />
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
    </WorkspaceProvider>
  );
}

export default App;
