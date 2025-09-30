import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import SignUp from "./pages/SignUp.jsx";
import Login from "./pages/Login.jsx";
import Layout from "./pages/Layout.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import Upload from "./pages/Upload.jsx";

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <App /> },
      { path: "/login", element: <Login /> },
      { path: "/signup", element: <SignUp /> },
      { path: "/upload", element: <Upload /> },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>
);
