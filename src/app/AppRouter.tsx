import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { BusinessShell } from '../components/layout/BusinessShell'
import { AdminShell } from '../components/layout/AdminShell'
import { ProtectedRoute } from '../components/ui/ProtectedRoute'
import { AppointmentDetailPage } from '../pages/AppointmentDetailPage'
import { AppointmentsPage } from '../pages/AppointmentsPage'
import { BookAppointmentPage } from '../pages/BookAppointmentPage'
import { DisputeDetailPage } from '../pages/DisputeDetailPage'
import { DisputeNewPage } from '../pages/DisputeNewPage'
import { DisputesPage } from '../pages/DisputesPage'
import { FavoritesPage } from '../pages/FavoritesPage'
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage'
import { ResetPasswordPage } from '../pages/ResetPasswordPage'
import { EmergencyPage } from '../pages/EmergencyPage'
import { NotificationsPage } from '../pages/NotificationsPage'
import { RequestQuotePage } from '../pages/RequestQuotePage'
import { GarageDetailPage } from '../pages/GarageDetailPage'
import { HomePage } from '../pages/HomePage'
import { InvoiceDetailPage } from '../pages/InvoiceDetailPage'
import { InvoicesPage } from '../pages/InvoicesPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { ProfilePage } from '../pages/ProfilePage'
import { QuotationDetailPage } from '../pages/QuotationDetailPage'
import { QuotationsPage } from '../pages/QuotationsPage'
import { ReviewDetailPage } from '../pages/ReviewDetailPage'
import { ReviewFormPage } from '../pages/ReviewFormPage'
import { ReviewsPage } from '../pages/ReviewsPage'
import { SearchPage } from '../pages/SearchPage'
import { SignInPage } from '../pages/SignInPage'
import { VehicleDetailPage } from '../pages/VehicleDetailPage'
import { VehicleFormPage } from '../pages/VehicleFormPage'
import { VehiclesPage } from '../pages/VehiclesPage'
import { VerifyPage } from '../pages/VerifyPage'
import { LegalIndexPage } from '../pages/LegalIndexPage'
import { LegalDocumentPage } from '../pages/LegalDocumentPage'
import { BusinessDashboardPage } from '../pages/business/BusinessDashboardPage'
import { BusinessApplicationsPage } from '../pages/business/BusinessApplicationsPage'
import { BusinessApplicationWizardPage } from '../pages/business/BusinessApplicationWizardPage'
import { BusinessAppointmentsPage } from '../pages/business/BusinessAppointmentsPage'
import { BusinessAppointmentDetailPage } from '../pages/business/BusinessAppointmentDetailPage'
import { BusinessGaragePage } from '../pages/business/BusinessGaragePage'
import { BusinessProductsPage } from '../pages/business/BusinessProductsPage'
import { BusinessQuotationsPage } from '../pages/business/BusinessQuotationsPage'
import { BusinessInvoicesPage } from '../pages/business/BusinessInvoicesPage'
import { BusinessTeamPage } from '../pages/business/BusinessTeamPage'
import { BusinessAcceptInvitationPage } from '../pages/business/BusinessAcceptInvitationPage'
import { BusinessMembershipOutlet } from '../components/business/RequireBusinessMembership'
import {
  AdminGarageSetupPage,
  BusinessGarageSetupPage,
} from '../pages/shared/GarageSetupPages'
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage'
import { AdminApplicationsPage } from '../pages/admin/AdminApplicationsPage'
import { AdminApplicationDetailPage } from '../pages/admin/AdminApplicationDetailPage'
import { AdminGarageCapabilitiesPage } from '../pages/admin/AdminGarageCapabilitiesPage'
import { AdminDisputesPage } from '../pages/admin/AdminDisputesPage'
import { AdminReviewsPage } from '../pages/admin/AdminReviewsPage'


export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="garages/:slug" element={<GarageDetailPage />} />
          <Route
            path="garages/:slug/book"
            element={
              <ProtectedRoute>
                <BookAppointmentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="garages/:slug/request-quote"
            element={
              <ProtectedRoute>
                <RequestQuotePage />
              </ProtectedRoute>
            }
          />
          <Route path="emergency" element={<EmergencyPage />} />
          <Route
            path="notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="favorites"
            element={
              <ProtectedRoute>
                <FavoritesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="appointments"
            element={
              <ProtectedRoute>
                <AppointmentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="appointments/:id"
            element={
              <ProtectedRoute>
                <AppointmentDetailPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="invoices"
            element={
              <ProtectedRoute>
                <InvoicesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="invoices/:id"
            element={
              <ProtectedRoute>
                <InvoiceDetailPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="quotations"
            element={
              <ProtectedRoute>
                <QuotationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="quotations/:id"
            element={
              <ProtectedRoute>
                <QuotationDetailPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="reviews"
            element={
              <ProtectedRoute>
                <ReviewsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="reviews/new/:eligibilityId"
            element={
              <ProtectedRoute>
                <ReviewFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="reviews/:id"
            element={
              <ProtectedRoute>
                <ReviewDetailPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="disputes"
            element={
              <ProtectedRoute>
                <DisputesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="disputes/new"
            element={
              <ProtectedRoute>
                <DisputeNewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="disputes/:id"
            element={
              <ProtectedRoute>
                <DisputeDetailPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="vehicles"
            element={
              <ProtectedRoute>
                <VehiclesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="vehicles/new"
            element={
              <ProtectedRoute>
                <VehicleFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="vehicles/:id/edit"
            element={
              <ProtectedRoute>
                <VehicleFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="vehicles/:id"
            element={
              <ProtectedRoute>
                <VehicleDetailPage />
              </ProtectedRoute>
            }
          />

          <Route path="profile" element={<ProfilePage />} />
          <Route path="sign-in" element={<SignInPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="auth/verify" element={<VerifyPage />} />
          <Route path="auth/reset-password" element={<ResetPasswordPage />} />
          <Route path="legal" element={<LegalIndexPage />} />
          <Route path="legal/:docId" element={<LegalDocumentPage />} />
          <Route path="bookings" element={<Navigate to="/appointments" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route path="home" element={<Navigate to="/" replace />} />

        <Route path="business" element={<BusinessShell />}>
          <Route path="applications" element={<BusinessApplicationsPage />} />
          <Route path="applications/:applicationId" element={<BusinessApplicationWizardPage />} />
          <Route path="invitations/accept" element={<BusinessAcceptInvitationPage />} />
          <Route element={<BusinessMembershipOutlet />}>
            <Route index element={<BusinessDashboardPage />} />
            <Route path="appointments" element={<BusinessAppointmentsPage />} />
            <Route path="appointments/:appointmentId" element={<BusinessAppointmentDetailPage />} />
            <Route path="quotations" element={<BusinessQuotationsPage />} />
            <Route path="invoices" element={<BusinessInvoicesPage />} />
            <Route path="garages/:businessId" element={<BusinessGaragePage />} />
            <Route path="garages/:businessId/setup" element={<BusinessGarageSetupPage />} />
            <Route path="garages/:businessId/products" element={<BusinessProductsPage />} />
            <Route path="garages/:businessId/team" element={<BusinessTeamPage />} />
          </Route>
        </Route>

        <Route path="admin" element={<AdminShell />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="applications" element={<AdminApplicationsPage />} />
          <Route path="applications/:applicationId" element={<AdminApplicationDetailPage />} />
          <Route path="businesses/:businessId/setup" element={<AdminGarageSetupPage />} />
          <Route
            path="businesses/:businessId/capabilities"
            element={<AdminGarageCapabilitiesPage />}
          />
          <Route path="disputes" element={<AdminDisputesPage />} />
          <Route path="reviews" element={<AdminReviewsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
