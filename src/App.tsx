import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Interview from './pages/Interview';
import Results from './pages/Results';
import Review from './pages/Review';
import Backlog from './pages/Backlog';

const App: React.FC = () => {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/interview" element={<Interview />} />
            <Route path="/results" element={<Results />} />
            <Route path="/review" element={<Review />} />
            <Route path="/backlog" element={<Backlog />} />
        </Routes>
    );
};

export default App;
