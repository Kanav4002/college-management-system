import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/socketContext.jsx";
import { ThemeProvider } from "./context/ThemeContext";
import "./index.css";
import App from "./App.jsx";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      {googleClientId ? (
        <GoogleOAuthProvider clientId={googleClientId}>
          <BrowserRouter>
            <AuthProvider>
              <SocketProvider>
                <App />
              </SocketProvider>
            </AuthProvider>
          </BrowserRouter>
        </GoogleOAuthProvider>
      ) : (
        <BrowserRouter>
          <AuthProvider>
            <SocketProvider>
              <App />
            </SocketProvider>
          </AuthProvider>
        </BrowserRouter>
      )}
    </ThemeProvider>
  </StrictMode>
);
