import { LoginPage } from "./pages/login-page";
import { SignupPage } from "./pages/signup-page"; 
import { createBrowserRouter, Navigate } from "react-router-dom";
import { Layout } from "./components/layout";
import { HomePage } from "./pages/home-page";
import { PortfolioPage } from "./pages/portfolio-page";
import { TradingPage } from "./pages/trading-page";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { api } from "./services/api";

// Loader function to check auth before rendering
async function protectedLoader() {
  if (!api.token) {
    return <Navigate to="/login" />;
  }
  return null;
}


function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <Layout />
    </ProtectedRoute>
  );
}

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/signup",
    Component: SignupPage,
  },
  {
    path: "/",
    Component: ProtectedLayout,
    children: [
      { index: true, Component: HomePage },
      { path: "portfolio", Component: PortfolioPage },
      { path: "trading", Component: TradingPage },
    ],
  },
]);