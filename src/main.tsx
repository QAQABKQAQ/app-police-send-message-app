import React from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router";
import DefaultPage from "./pages/home/App";
import LoginPage from "./pages/login/Login";
import RecordPage from "./pages/record/Record";
import MessageDetailPage from "./pages/detail/MessageDetail";
import MinePage from "./pages/mine/Mine";
import UploadViolationPage from "./pages/upload/UploadViolation";
import AuthGuard from "./components/auth/AuthGuard";
import { ThemeProvider } from "./components/theme/theme-provider";
import { getAuthToken } from "./lib/request";

// 初始化时从 localStorage 加载 token
getAuthToken();


const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <AuthGuard>
        <DefaultPage />
      </AuthGuard>
    ),
  },
  {
    path: "/record",
    element: (
      <AuthGuard>
        <RecordPage />
      </AuthGuard>
    ),
  },
  {
    path: "/detail/:id",
    element: (
      <AuthGuard>
        <MessageDetailPage />
      </AuthGuard>
    ),
  },
  {
    path: "/mine",
    element: (
      <AuthGuard>
        <MinePage />
      </AuthGuard>
    ),
  },
  {
    path: "/upload",
    element: (
      <AuthGuard>
        <UploadViolationPage />
      </AuthGuard>
    ),
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>,
);
