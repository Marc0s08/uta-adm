import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import AdminPage from './AdminPage';
import ManageDocuments from './ManageDocuments'; // Importe a página de gerenciamento de documentos

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<AdminPage />} />
          <Route path="/manage-documents" element={<ManageDocuments />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
