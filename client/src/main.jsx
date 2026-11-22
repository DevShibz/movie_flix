import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import { ToastProvider } from './components/Toast.jsx';
import { CategoriesProvider } from './components/CategoriesContext.jsx';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <ToastProvider position="top-right" duration={4000}>
      <CategoriesProvider>
        <App />
      </CategoriesProvider>
    </ToastProvider>
  </BrowserRouter>
);
