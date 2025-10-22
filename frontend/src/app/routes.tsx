import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "./layout/AppLayout";
import { HomePage } from "@/features/hotels/pages/HomePage";
import { HotelDetailPage } from "@/features/hotels/pages/HotelDetailPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { AdminLoginPage } from "@/features/admin/pages/AdminLoginPage";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import { AdminLayout } from "@/features/admin/components/AdminLayout";
import { AdminDashboardPage } from "@/features/admin/pages/AdminDashboardPage";
import { AdminProductsPage } from "@/features/admin/pages/AdminProductsPage";
import { AdminCategoriesPage } from "@/features/admin/pages/AdminCategoriesPage";
import { AdminHotelsPage } from "@/features/admin/pages/AdminHotelsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "hotel/:slug", element: <HotelDetailPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
  {
    path: "/admin",
    children: [
      { index: true, element: <Navigate to="login" replace /> },
      { path: "login", element: <AdminLoginPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { path: "dashboard", element: <AdminDashboardPage /> },
              { path: "hotels", element: <AdminHotelsPage /> },
              { path: "products", element: <AdminProductsPage /> },
              { path: "categories", element: <AdminCategoriesPage /> },
              { path: "*", element: <NotFoundPage /> },
            ],
          },
        ],
      },
    ],
  },
]);
