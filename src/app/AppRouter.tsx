import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { ProtectedRoute } from '../components/ui/ProtectedRoute'
import { BookingsPage } from '../pages/BookingsPage'
import { GarageDetailPage } from '../pages/GarageDetailPage'
import { HomePage } from '../pages/HomePage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { ProfilePage } from '../pages/ProfilePage'
import { SearchPage } from '../pages/SearchPage'
import { SignInPage } from '../pages/SignInPage'
import { VehiclesPage } from '../pages/VehiclesPage'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="garages/:slug" element={<GarageDetailPage />} />
          <Route
            path="bookings"
            element={
              <ProtectedRoute>
                <BookingsPage />
              </ProtectedRoute>
            }
          />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="vehicles" element={
            <ProtectedRoute>
              <VehiclesPage />
            </ProtectedRoute>
          } />
          <Route path="sign-in" element={<SignInPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route path="home" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
