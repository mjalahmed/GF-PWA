import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { ProtectedRoute } from '../components/ui/ProtectedRoute'
import { AppointmentDetailPage } from '../pages/AppointmentDetailPage'
import { AppointmentsPage } from '../pages/AppointmentsPage'
import { BookAppointmentPage } from '../pages/BookAppointmentPage'
import { DisputeDetailPage } from '../pages/DisputeDetailPage'
import { DisputeNewPage } from '../pages/DisputeNewPage'
import { DisputesPage } from '../pages/DisputesPage'
import { FavoritesPage } from '../pages/FavoritesPage'
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage'
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
          <Route path="bookings" element={<Navigate to="/appointments" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route path="home" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
