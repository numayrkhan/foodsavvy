// 📁 File: client/src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Header from "../components/Header";
import Hero from "../components/Hero";
import HowItWorks from "../components/HowItWorks";
import Testimonials from "../components/Testimonials";
import Catering from "../components/Catering";
import Cart from "../components/Cart";
import CheckoutPage from "../components/CheckoutPage";
import OrderConfirmation from "../components/OrderConfirmation";
import Footer from "../components/Footer";
import MenuSectionV2 from "../components/MenuSectionV2";
import ScrollToTop from "../components/ScrollToTop";

// ⬅ F5
import FulfillmentBar from "../components/FulfillmentBar";
import FulfillmentModal from "../components/FulfillmentModal";

// 🔐 admin imports (keep DashboardHome placeholder, V2 pages)
import AdminAuthProvider from "./auth/AdminAuthProvider";
import AdminRoute from "./auth/AdminRoute";
import AdminLayout from "./admin/AdminLayout";
import LoginPage from "./admin/LoginPage";
import DashboardHome from "./admin/DashboardHome"; // placeholder, must NOT use MUI
import MenuSchedulerPage from "./admin/v2/menuScheduler/MenuSchedulerPage";
import DeliverySettingsPage from "./admin/v2/delivery/DeliverySettingsPage";

function Home() {
  return (
    <>
      <Hero />
      <div id="weekly-menu">
        <MenuSectionV2 />
      </div>
      <div id="how-it-works">
        <HowItWorks />
      </div>
      <div id="testimonials">
        <Testimonials />
      </div>
      <div id="catering">
        <Catering />
      </div>
    </>
  );
}

// Layout wrapper to ensure Header + Bar + Footer exist on all public pages
function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-black">
      <Header />
      <FulfillmentBar />
      {children}
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AdminAuthProvider>
      <Router>
        <ScrollToTop />
        <FulfillmentModal />

        <Routes>
          {/* Public routes */}
          <Route
            path="/"
            element={
              <PublicLayout>
                <Home />
              </PublicLayout>
            }
          />
          <Route
            path="/cart"
            element={
              <PublicLayout>
                <Cart />
              </PublicLayout>
            }
          />
          <Route
            path="/checkout"
            element={
              <PublicLayout>
                <CheckoutPage />
              </PublicLayout>
            }
          />
          <Route
            path="/order-confirmation"
            element={
              <PublicLayout>
                <OrderConfirmation />
              </PublicLayout>
            }
          />
          <Route
            path="/v2/menu"
            element={
              <PublicLayout>
                <MenuSectionV2 />
              </PublicLayout>
            }
          />

          {/* Admin login */}
          <Route path="/admin/login" element={<LoginPage />} />

          {/* Admin (protected) */}
          <Route path="/admin" element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              {/* Keep placeholder dashboard */}
              <Route index element={<DashboardHome />} />

              {/* V2 Admin */}
              <Route path="v2/menu-scheduler" element={<MenuSchedulerPage />} />
              <Route path="v2/delivery-settings" element={<DeliverySettingsPage />} />

              {/* Legacy v1 paths disabled (redirect to v2) */}
              <Route path="orders" element={<Navigate to="/admin/v2/menu-scheduler" replace />} />
              <Route path="menus" element={<Navigate to="/admin/v2/menu-scheduler" replace />} />
              <Route path="delivery" element={<Navigate to="/admin/v2/delivery-settings" replace />} />
            </Route>
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AdminAuthProvider>
  );
}

export default App;
