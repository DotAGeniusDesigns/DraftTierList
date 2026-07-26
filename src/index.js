import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import './index.css';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <ErrorBoundary>
        <BrowserRouter>
            <App />
            {/* Vercel Web Analytics. Inside the router so client-side route
                changes are tracked as pageviews. No-ops off Vercel. */}
            <Analytics />
        </BrowserRouter>
    </ErrorBoundary>
);
