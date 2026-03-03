import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "./context/AppContext.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import LoadingSpinner from "./components/ui/LoadingSpinner.jsx";
import GlobalShell from "./components/layout/GlobalShell.jsx";
import ProjectShell from "./components/layout/ProjectShell.jsx";

// Lazy-loaded global pages
const DashboardPage = lazy(() => import("./pages/global/DashboardPage.jsx"));
const ProjectsListPage = lazy(() => import("./pages/global/ProjectsListPage.jsx"));
const ClientsListPage = lazy(() => import("./pages/global/ClientsListPage.jsx"));
const ClientDetailPage = lazy(() => import("./pages/global/ClientDetailPage.jsx"));
const TradesListPage = lazy(() => import("./pages/global/TradesListPage.jsx"));
const TradeDetailPage = lazy(() => import("./pages/global/TradeDetailPage.jsx"));
const RateLibraryPage = lazy(() => import("./pages/global/RateLibraryPage.jsx"));
const SettingsPage = lazy(() => import("./pages/global/SettingsPage.jsx"));
const DataPage = lazy(() => import("./pages/global/DataPage.jsx"));
const QuotesListPage = lazy(() => import("./pages/global/QuotesListPage.jsx"));
const JobsListPage = lazy(() => import("./pages/global/JobsListPage.jsx"));

// Lazy-loaded project pages
const OverviewPage = lazy(() => import("./pages/project/OverviewPage.jsx"));
const ScopePage = lazy(() => import("./pages/project/ScopePage.jsx"));
const QuotePage = lazy(() => import("./pages/project/QuotePage.jsx"));
const PlansAIPage = lazy(() => import("./pages/project/PlansAIPage.jsx"));
const CostsPage = lazy(() => import("./pages/project/CostsPage.jsx"));
const SchedulePage = lazy(() => import("./pages/project/SchedulePage.jsx"));
const VariationsPage = lazy(() => import("./pages/project/VariationsPage.jsx"));
const VariationDetail = lazy(() => import("./pages/project/VariationDetail.jsx"));
const InvoicesPage = lazy(() => import("./pages/project/InvoicesPage.jsx"));
const InvoiceDetail = lazy(() => import("./pages/project/InvoiceDetail.jsx"));
const ProposalsPage = lazy(() => import("./pages/project/ProposalsPage.jsx"));
const ProposalDetail = lazy(() => import("./pages/project/ProposalDetail.jsx"));
const DocumentsPage = lazy(() => import("./pages/project/DocumentsPage.jsx"));
const SiteDiaryPage = lazy(() => import("./pages/project/SiteDiaryPage.jsx"));
const DefectsPage = lazy(() => import("./pages/project/DefectsPage.jsx"));
const ProjectTradesPage = lazy(() => import("./pages/project/ProjectTradesPage.jsx"));
const BillsPage = lazy(() => import("./pages/project/BillsPage.jsx"));
const PaymentsPage = lazy(() => import("./pages/project/PaymentsPage.jsx"));
const WorkOrdersPage = lazy(() => import("./pages/project/WorkOrdersPage.jsx"));
const PurchaseOrdersPage = lazy(() => import("./pages/project/PurchaseOrdersPage.jsx"));
const RFQPage = lazy(() => import("./pages/project/RFQPage.jsx"));

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <ErrorBoundary level="app">
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route element={<GlobalShell />}>
                {/* Redirect root to dashboard */}
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="projects" element={<ProjectsListPage />} />
                <Route path="quotes" element={<QuotesListPage />} />
                <Route path="leads" element={<QuotesListPage />} />
                <Route path="jobs" element={<JobsListPage />} />
                <Route path="clients" element={<ClientsListPage />} />
                <Route path="clients/:clientId" element={<ClientDetailPage />} />
                <Route path="trades" element={<TradesListPage />} />
                <Route path="trades/:tradeId" element={<TradeDetailPage />} />
                <Route path="rate-library" element={<RateLibraryPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="settings/data" element={<DataPage />} />

                {/* Project routes — isolated error boundary */}
                <Route path="projects/:id" element={
                  <ErrorBoundary level="project">
                    <ProjectShell />
                  </ErrorBoundary>
                }>
                  <Route index element={<Navigate to="overview" replace />} />
                  <Route path="overview" element={<OverviewPage />} />
                  <Route path="quote" element={<QuotePage />} />
                  <Route path="scope" element={<ScopePage />} />
                  <Route path="plans" element={<PlansAIPage />} />
                  <Route path="plans-ai" element={<PlansAIPage />} />
                  <Route path="costs" element={<CostsPage />} />
                  <Route path="schedule" element={<SchedulePage />} />
                  <Route path="variations" element={<VariationsPage />} />
                  <Route path="variations/:voIndex" element={<VariationDetail />} />
                  <Route path="invoices" element={<InvoicesPage />} />
                  <Route path="invoices/:invIndex" element={<InvoiceDetail />} />
                  <Route path="bills" element={<BillsPage />} />
                  <Route path="payments" element={<PaymentsPage />} />
                  <Route path="proposals" element={<ProposalsPage />} />
                  <Route path="proposals/:propIndex" element={<ProposalDetail />} />
                  <Route path="documents" element={<DocumentsPage />} />
                  <Route path="site-diary" element={<SiteDiaryPage />} />
                  <Route path="defects" element={<DefectsPage />} />
                  <Route path="trades" element={<ProjectTradesPage />} />
                  <Route path="work-orders" element={<WorkOrdersPage />} />
                  <Route path="purchase-orders" element={<PurchaseOrdersPage />} />
                  <Route path="rfq" element={<RFQPage />} />
                  <Route path="modules" element={<Navigate to="overview" replace />} />
                </Route>
                <Route path="modules/:moduleId" element={<Navigate to="/projects" replace />} />
              </Route>
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </AppProvider>
    </BrowserRouter>
  );
}
