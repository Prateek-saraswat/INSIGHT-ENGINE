import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ResearchDashboard from './pages/ResearchDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/research/:sessionId" element={<ResearchDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
