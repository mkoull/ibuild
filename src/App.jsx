import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "./context/AppContext.jsx";
import GlobalShell from "./components/layout/GlobalShell.jsx";
import ProjectShell from "./components/layout/ProjectShell.jsx";

// Global pages
import DashboardPage from "./pages/global/DashboardPage.jsx";
import ProjectsListPage from "./pages/global/ProjectsListPage.jsx";
import ClientsListPage from "./pages/global/ClientsListPage.jsx";
import ClientDetailPage from "./pages/global/ClientDetailPage.jsx";
import TradesListPage from "./pages/global/TradesListPage.jsx";
import TradeDetailPage from "./pages/global/TradeDetailPage.jsx";
import RateLibraryPage from "./pages/global/RateLibraryPage.jsx";
import SettingsPage from "./pages/global/SettingsPage.jsx";

// Project pages
import OverviewPage from "./pages/project/OverviewPage.jsx";
import ScopePage from "./pages/project/ScopePage.jsx";
import PlansAIPage from "./pages/project/PlansAIPage.jsx";
import CostsPage from "./pages/project/CostsPage.jsx";
import SchedulePage from "./pages/project/SchedulePage.jsx";
import VariationsPage from "./pages/project/VariationsPage.jsx";
import VariationDetail from "./pages/project/VariationDetail.jsx";
import InvoicesPage from "./pages/project/InvoicesPage.jsx";
import InvoiceDetail from "./pages/project/InvoiceDetail.jsx";
import ProposalsPage from "./pages/project/ProposalsPage.jsx";
import ProposalDetail from "./pages/project/ProposalDetail.jsx";
import DocumentsPage from "./pages/project/DocumentsPage.jsx";
import SiteDiaryPage from "./pages/project/SiteDiaryPage.jsx";
import DefectsPage from "./pages/project/DefectsPage.jsx";
import ProjectTradesPage from "./pages/project/ProjectTradesPage.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route element={<GlobalShell />}>
            {/* Redirect root to dashboard */}
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="projects" element={<ProjectsListPage />} />
            <Route path="clients" element={<ClientsListPage />} />
            <Route path="clients/:clientId" element={<ClientDetailPage />} />
            <Route path="trades" element={<TradesListPage />} />
            <Route path="trades/:tradeId" element={<TradeDetailPage />} />
            <Route path="rate-library" element={<RateLibraryPage />} />
            <Route path="settings" element={<SettingsPage />} />

            {/* Project routes */}
            <Route path="projects/:id" element={<ProjectShell />}>
              <Route index element={<Navigate to="overview" replace />} />
              <Route path="overview" element={<OverviewPage />} />
              <Route path="scope" element={<ScopePage />} />
              <Route path="plans" element={<PlansAIPage />} />
              <Route path="costs" element={<CostsPage />} />
              <Route path="schedule" element={<SchedulePage />} />
              <Route path="variations" element={<VariationsPage />} />
              <Route path="variations/:voIndex" element={<VariationDetail />} />
              <Route path="invoices" element={<InvoicesPage />} />
              <Route path="invoices/:invIndex" element={<InvoiceDetail />} />
              <Route path="proposals" element={<ProposalsPage />} />
              <Route path="proposals/:propIndex" element={<ProposalDetail />} />
              <Route path="documents" element={<DocumentsPage />} />
              <Route path="site-diary" element={<SiteDiaryPage />} />
              <Route path="defects" element={<DefectsPage />} />
              <Route path="trades" element={<ProjectTradesPage />} />
            </Route>
          </Route>
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}
