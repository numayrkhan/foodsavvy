// 📁 File: client/src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "../components/Header";
import Hero from "../components/Hero";
import MenuSection from "../components/MenuSection";
import HowItWorks from "../components/HowItWorks";
import Testimonials from "../components/Testimonials";
import Catering from "../components/Catering";
import Cart from "../components/Cart";
import OrderConfirmation from "../components/OrderConfirmation";
import Footer from "../components/Footer";

// 🔐 admin imports
import AdminAuthProvider from "./auth/AdminAuthProvider";
import AdminRoute from "./auth/AdminRoute";
import AdminLayout from "./admin/AdminLayout";
import LoginPage from "./admin/LoginPage";
import DashboardHome from "./admin/DashboardHome";
import OrderList from "./admin/OrderList";
import AdminMenus from "./admin/menus/AdminMenus";
import AdminDelivery from "./admin/AdminDelivery";

function Home() {
  return (
    <>
      <Hero />
      <div id="weekly-menu">
        <MenuSection title="Weekly Menu" type="weekly" />
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

function App() {
  return (
    <AdminAuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route
            path="/"
            element={
              <div className="min-h-screen bg-black">
                <Header />
                <Home />
                <Footer />
              </div>
            }
          />
          <Route
            path="/cart"
            element={
              <div className="min-h-screen bg-black">
                <Header />
                <Cart />
                <Footer />
              </div>
            }
          />
          <Route
            path="/order-confirmation"
            element={
              <div className="min-h-screen bg-black">
                <Header />
                <OrderConfirmation />
                <Footer />
              </div>
            }
          />

          {/* Admin login page (no layout wrapper) */}
          <Route path="/admin/login" element={<LoginPage />} />

          {/* Protected admin routes with layout */}
          <Route path="/admin" element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<DashboardHome />} />
              <Route path="orders" element={<OrderList />} />
              <Route path="menus" element={<AdminMenus />} />
              <Route path="delivery" element={<AdminDelivery />} />
              {/* Add more admin pages here later */}
            </Route>
          </Route>
        </Routes>
      </Router>
    </AdminAuthProvider>
  );
}

export default App;
