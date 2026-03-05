import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "./context/AppContext.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import LoadingSpinner from "./components/ui/LoadingSpinner.jsx";
import GlobalShell from "./components/layout/GlobalShell.jsx";
import WorkspaceShell from "./components/layout/WorkspaceShell.jsx";
import LegacyJobRedirect from "./components/routing/LegacyJobRedirect.jsx";
import AuthGate from "./components/guards/AuthGate.jsx";
import SubcontractorRestricted from "./components/guards/SubcontractorRestricted.jsx";

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
const CreateEstimateWizardPage = lazy(() => import("./pages/global/CreateEstimateWizardPage.jsx"));
const JobsListPage = lazy(() => import("./pages/global/JobsListPage.jsx"));
const InvoicesListPage = lazy(() => import("./pages/global/InvoicesListPage.jsx"));
const BillsListPage = lazy(() => import("./pages/global/BillsListPage.jsx"));
const PaymentsListPage = lazy(() => import("./pages/global/PaymentsListPage.jsx"));
const DocumentsListPage = lazy(() => import("./pages/global/DocumentsListPage.jsx"));
const SiteDiaryListPage = lazy(() => import("./pages/global/SiteDiaryListPage.jsx"));
const DefectsListPage = lazy(() => import("./pages/global/DefectsListPage.jsx"));
const PipelineShell = lazy(() => import("./pages/sections/PipelineShell.jsx"));
const FinanceShell = lazy(() => import("./pages/sections/FinanceShell.jsx"));
const SiteShell = lazy(() => import("./pages/sections/SiteShell.jsx"));
const LoginPage = lazy(() => import("./pages/auth/LoginPage.jsx"));
const SubcontractorPortalPage = lazy(() => import("./pages/portal/SubcontractorPortalPage.jsx"));

// Lazy-loaded project pages
const OverviewPage = lazy(() => import("./pages/project/OverviewPage.jsx"));
const EstimateDetailsTab = lazy(() => import("./pages/project/EstimateDetailsTab.jsx"));
const ScopePage = lazy(() => import("./pages/project/ScopePage.jsx"));
const QuotePage = lazy(() => import("./pages/project/QuotePage.jsx"));
const BuildSectionPage = lazy(() => import("./pages/project/BuildSectionPage.jsx"));
const FinancialSectionPage = lazy(() => import("./pages/project/FinancialSectionPage.jsx"));
const CloseoutSectionPage = lazy(() => import("./pages/project/CloseoutSectionPage.jsx"));
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
const LockedTabGate = lazy(() => import("./components/ui/LockedTabGate.jsx"));

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <ErrorBoundary level="app">
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="login" element={<LoginPage />} />
              <Route element={<AuthGate><GlobalShell /></AuthGate>}>
                {/* Redirect root to dashboard */}
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="portal" element={<SubcontractorPortalPage />} />
                <Route path="projects" element={<ProjectsListPage />} />
                <Route path="estimates" element={<QuotesListPage />} />
                <Route
                  path="estimates/new"
                  element={(
                    <ErrorBoundary level="project">
                      <CreateEstimateWizardPage />
                    </ErrorBoundary>
                  )}
                />
                <Route path="jobs" element={<JobsListPage />} />
                <Route path="pipeline" element={<PipelineShell />}>
                  <Route index element={<Navigate to="clients" replace />} />
                  <Route path="clients" element={<ClientsListPage />} />
                  <Route path="leads" element={<QuotesListPage />} />
                  <Route path="quotes" element={<QuotesListPage />} />
                </Route>
                <Route path="finance" element={<SubcontractorRestricted message="Finance is not available in the subcontractor portal."><FinanceShell /></SubcontractorRestricted>}>
                  <Route index element={<Navigate to="invoices" replace />} />
                  <Route path="invoices" element={<SubcontractorRestricted message="Invoices are hidden for subcontractor users."><InvoicesListPage /></SubcontractorRestricted>} />
                  <Route path="bills" element={<BillsListPage />} />
                  <Route path="payments" element={<PaymentsListPage />} />
                </Route>
                <Route path="site" element={<SiteShell />}>
                  <Route index element={<Navigate to="documents" replace />} />
                  <Route path="documents" element={<DocumentsListPage />} />
                  <Route path="diary" element={<SiteDiaryListPage />} />
                  <Route path="defects" element={<DefectsListPage />} />
                </Route>
                <Route path="clients/:clientId" element={<ClientDetailPage />} />
                <Route path="clients" element={<Navigate to="/pipeline/clients" replace />} />
                <Route path="leads" element={<Navigate to="/pipeline/leads" replace />} />
                <Route path="quotes" element={<Navigate to="/pipeline/quotes" replace />} />
                <Route path="invoices" element={<Navigate to="/finance/invoices" replace />} />
                <Route path="bills" element={<Navigate to="/finance/bills" replace />} />
                <Route path="payments" element={<Navigate to="/finance/payments" replace />} />
                <Route path="documents" element={<Navigate to="/site/documents" replace />} />
                <Route path="site-diary" element={<Navigate to="/site/diary" replace />} />
                <Route path="defects" element={<Navigate to="/site/defects" replace />} />
                <Route path="trades" element={<TradesListPage />} />
                <Route path="trades/:tradeId" element={<TradeDetailPage />} />
                <Route path="rate-library" element={<RateLibraryPage />} />
                <Route path="cost-library" element={<RateLibraryPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="settings/data" element={<DataPage />} />

                {/* ─── Estimate workspace ─── */}
                <Route path="estimates/:estimateId/*" element={
                  <ErrorBoundary level="project">
                    <WorkspaceShell workspaceType="estimate" />
                  </ErrorBoundary>
                }>
                  <Route index element={<Navigate to="overview" replace />} />
                  <Route path="overview" element={<SubcontractorRestricted message="Estimate details are restricted for subcontractor users."><EstimateDetailsTab /></SubcontractorRestricted>} />
                  <Route path="estimate" element={<SubcontractorRestricted message="Estimate data is restricted for subcontractor users."><Navigate to="../quote" replace /></SubcontractorRestricted>} />
                  <Route path="scope" element={<SubcontractorRestricted message="Costing data is restricted for subcontractor users."><Navigate to="../quote" replace /></SubcontractorRestricted>} />
                  <Route path="quote" element={<SubcontractorRestricted message="Quote and pricing data is restricted for subcontractor users."><QuotePage /></SubcontractorRestricted>} />
                  <Route path="build" element={<BuildSectionPage />} />
                  <Route path="financial" element={<SubcontractorRestricted message="Financial data is restricted for subcontractor users."><FinancialSectionPage /></SubcontractorRestricted>} />
                  <Route path="closeout" element={<CloseoutSectionPage />} />
                  <Route path="schedule" element={<LockedTabGate><SchedulePage /></LockedTabGate>} />
                  <Route path="costs" element={<SubcontractorRestricted message="Cost data is restricted for subcontractor users."><LockedTabGate><CostsPage /></LockedTabGate></SubcontractorRestricted>} />
                  <Route path="variations" element={<LockedTabGate><VariationsPage /></LockedTabGate>} />
                  <Route path="procurement" element={<LockedTabGate><PurchaseOrdersPage /></LockedTabGate>} />
                  <Route path="invoices" element={<SubcontractorRestricted message="Invoices are restricted for subcontractor users."><LockedTabGate><InvoicesPage /></LockedTabGate></SubcontractorRestricted>} />
                  <Route path="documents" element={<DocumentsPage />} />
                  <Route path="site-diary" element={<LockedTabGate><SiteDiaryPage /></LockedTabGate>} />
                  <Route path="defects" element={<LockedTabGate><DefectsPage /></LockedTabGate>} />
                  {/* Shortcut routes */}
                  <Route path="pricing" element={<Navigate to="../quote?step=pricing" replace />} />
                  {/* Legacy estimate routes kept for compatibility */}
                  <Route path="plans" element={<PlansAIPage />} />
                  <Route path="quote-review" element={<QuotePage />} />
                  <Route path="costings" element={<Navigate to="../quote" replace />} />
                  <Route path="rfq" element={<RFQPage />} />
                  <Route path="proposals" element={<ProposalsPage />} />
                  <Route path="proposals/:propIndex" element={<ProposalDetail />} />
                  <Route path="job-overview" element={<Navigate to="../overview" replace />} />
                  <Route path="purchase-orders" element={<Navigate to="../procurement" replace />} />
                  <Route path="work-orders" element={<Navigate to="../procurement" replace />} />
                </Route>

                {/* ─── Canonical project workspace ─── */}
                <Route path="projects/:id/*" element={
                  <ErrorBoundary level="project">
                    <WorkspaceShell workspaceType="job" />
                  </ErrorBoundary>
                }>
                  <Route index element={<Navigate to="overview" replace />} />
                  <Route path="overview" element={<SubcontractorRestricted message="Project financial overview is restricted for subcontractor users."><OverviewPage /></SubcontractorRestricted>} />
                  <Route path="overview/*" element={<Navigate to="../overview" replace />} />
                  <Route path="estimate" element={<SubcontractorRestricted message="Estimate data is restricted for subcontractor users."><Navigate to="../scope" replace /></SubcontractorRestricted>} />
                  <Route path="scope" element={<SubcontractorRestricted message="Costing data is restricted for subcontractor users."><ScopePage /></SubcontractorRestricted>} />
                  <Route path="quote" element={<SubcontractorRestricted message="Quote and pricing data is restricted for subcontractor users."><QuotePage /></SubcontractorRestricted>} />
                  <Route path="build" element={<BuildSectionPage />} />
                  <Route path="financial" element={<SubcontractorRestricted message="Financial data is restricted for subcontractor users."><FinancialSectionPage /></SubcontractorRestricted>} />
                  <Route path="closeout" element={<CloseoutSectionPage />} />
                  <Route path="schedule" element={<LockedTabGate><SchedulePage /></LockedTabGate>} />
                  <Route path="costs" element={<SubcontractorRestricted message="Cost data is restricted for subcontractor users."><LockedTabGate><CostsPage /></LockedTabGate></SubcontractorRestricted>} />
                  <Route path="variations" element={<LockedTabGate><VariationsPage /></LockedTabGate>} />
                  <Route path="procurement" element={<LockedTabGate><PurchaseOrdersPage /></LockedTabGate>} />
                  <Route path="invoices" element={<SubcontractorRestricted message="Invoices are restricted for subcontractor users."><LockedTabGate><InvoicesPage /></LockedTabGate></SubcontractorRestricted>} />
                  <Route path="documents" element={<DocumentsPage />} />
                  <Route path="site-diary" element={<LockedTabGate><SiteDiaryPage /></LockedTabGate>} />
                  <Route path="defects" element={<LockedTabGate><DefectsPage /></LockedTabGate>} />
                  {/* Legacy job routes kept for compatibility */}
                  <Route path="purchase-orders" element={<Navigate to="../procurement" replace />} />
                  <Route path="work-orders" element={<Navigate to="../procurement" replace />} />
                  <Route path="variations/:voIndex" element={<VariationDetail />} />
                  <Route path="invoices/:invIndex" element={<InvoiceDetail />} />
                  <Route path="bills" element={<BillsPage />} />
                  <Route path="payments" element={<PaymentsPage />} />
                  <Route path="rfq" element={<RFQPage />} />
                  <Route path="proposals" element={<ProposalsPage />} />
                  <Route path="proposals/:propIndex" element={<ProposalDetail />} />
                  <Route path="trades" element={<ProjectTradesPage />} />
                  <Route path="plans" element={<PlansAIPage />} />
                </Route>

                {/* ─── Legacy jobs route redirect ─── */}
                <Route path="jobs/:jobId/*" element={<LegacyJobRedirect />} />
                <Route path="jobs/:id/*" element={<LegacyJobRedirect />} />

                <Route path="modules/:moduleId" element={<Navigate to="/projects" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </AppProvider>
    </BrowserRouter>
  );
}
