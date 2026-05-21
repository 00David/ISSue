import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'leaflet/dist/leaflet.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.css'
import 'react-leaflet-cluster/dist/assets/MarkerCluster.Default.css'
import './index.css'

import App from './App.jsx'

// Entry point for rendering the frontend in development

createRoot(document.getElementById('root')).render(
	<StrictMode>
		<App />
	</StrictMode>,
)