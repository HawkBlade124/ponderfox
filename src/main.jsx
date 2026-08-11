import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './assets/font-awesome/css/fontawesome.min.css';
import './assets/font-awesome/css/regular.min.css';
import './assets/font-awesome/css/solid.min.css';
import './css/index.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import ReactModal from "react-modal";
import {StyledEngineProvider} from "@mui/material/styles";

ReactModal.setAppElement("#root");

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
    <StyledEngineProvider injectFirst>
      <AuthProvider>
        <App />
      </AuthProvider>
      </StyledEngineProvider>
    </BrowserRouter>
  </StrictMode>
)
