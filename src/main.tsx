import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { PassProvider } from './context/PassContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <PassProvider>
        <App />
      </PassProvider>
    </ErrorBoundary>
  </StrictMode>,
);
