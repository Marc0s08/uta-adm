
import React from 'react';
import { BrowserRouter as Router, Route, Routes, NavLink } from 'react-router-dom';
import AdminPage from './AdminPage';
import ManageDocuments from './ManageDocuments';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="main-navigation">
          <div className="navigation-content">
            <div className="navigation-brand">
              <span className="brand-highlight">UTA</span> AIRSOFT
              <small>PAINEL ADMINISTRATIVO</small>
            </div>

            <div className="navigation-links">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `navigation-button ${isActive ? 'active' : ''}`
                }
              >
                <span>⚙</span>
                Administração
              </NavLink>

              <NavLink
                to="/manage-documents"
                className={({ isActive }) =>
                  `navigation-button ${isActive ? 'active' : ''}`
                }
              >
                <span>▤</span>
                Gerenciar postagens
              </NavLink>
            </div>
          </div>
        </nav>

        <main className="app-content">
          <Routes>
            <Route path="/" element={<AdminPage />} />
            <Route path="/manage-documents" element={<ManageDocuments />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
