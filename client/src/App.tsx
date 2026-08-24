import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { Layout } from "./components/common/Layout";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { DashboardPage } from "./pages/DashboardPage";
import { BookInventoryPage } from "./pages/BookInventoryPage";
import { BookingDetailsPage } from "./pages/BookingDetailsPage";
import { PickupPage } from "./pages/PickupPage";
import { DropPage } from "./pages/DropPage";
import { AdminCheckInventoryPage } from "./pages/AdminCheckInventoryPage";
import { AdminDropApprovalPage } from "./pages/AdminDropApprovalPage";
import { AdminInventoryListPage } from "./pages/AdminInventoryListPage";
import { AdminInventoryFormPage } from "./pages/AdminInventoryFormPage";
import { NotificationsPage } from "./pages/NotificationsPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/book" element={<BookInventoryPage />} />
                <Route path="/bookings/:id" element={<BookingDetailsPage />} />
                <Route path="/bookings/:id/pickup" element={<PickupPage />} />
                <Route path="/bookings/:id/drop" element={<DropPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />

                <Route element={<ProtectedRoute role="admin" />}>
                  <Route path="/admin/check-inventory" element={<AdminCheckInventoryPage />} />
                  <Route path="/admin/check-inventory/:id" element={<AdminDropApprovalPage />} />
                  <Route path="/admin/inventory" element={<AdminInventoryListPage />} />
                  <Route path="/admin/inventory/new" element={<AdminInventoryFormPage />} />
                  <Route path="/admin/inventory/:id/edit" element={<AdminInventoryFormPage />} />
                </Route>
              </Route>
            </Route>
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
