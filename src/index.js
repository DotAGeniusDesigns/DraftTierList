import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import './index.css';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <ErrorBoundary>
        <BrowserRouter>
            {/* Inside the router because the auth UI navigates (redirect after
                sign-in, route guards), and outside App so every route can read
                the session. */}
            <AuthProvider>
                <App />
            </AuthProvider>
            {/* Vercel Web Analytics. Inside the router so client-side route
                changes are tracked as pageviews. No-ops off Vercel. */}
            <Analytics />
        </BrowserRouter>
    </ErrorBoundary>
);
