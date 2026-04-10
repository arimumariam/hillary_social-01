import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// Render the mariam.jsx component from the project root
import Mariam from '../mariam.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Mariam />
  </StrictMode>,
)
