import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initAutoClearCacheListeners } from './utils/cacheUtils';

initAutoClearCacheListeners();

createRoot(document.getElementById('root')!).render(<App />);
