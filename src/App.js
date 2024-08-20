// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import AdminPage from './AdminPage';
import ManageDocuments from './ManageDocuments';

function App() {
  return (
    <Router>
      <div className="App">
        <nav>
          <ul>
            <li><Link to="/">Admin Page</Link></li>
            <li><Link to="/manage-documents">Manage Documents</Link></li>
          </ul>
        </nav>
        <Routes>
          <Route path="/" element={<AdminPage />} />
          <Route path="/manage-documents" element={<ManageDocuments />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
