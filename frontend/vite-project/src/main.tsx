// src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import DriverPage from './pages/DriverPage'; // Importe a DriverPage

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/motorista" element={<DriverPage />} /> {/* Adicione a rota do motorista */}
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);