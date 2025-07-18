import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

//notes
/*
📘 main.jsx Revision Notes:

1. StrictMode:
   - Helps detect potential problems in development.
   - Does not affect production behavior.

2. createRoot:
   - New React 18+ API to render the app.
   - Replaces older ReactDOM.render method.

3. index.css:
   - Loads global styles like resets, fonts, and layout defaults.

4. App:
   - Root component of your application.
   - Contains routing and main UI structure.

5. document.getElementById('root'):
   - Selects the root HTML element where the React app will mount.

6. render():
   - Starts rendering your React component tree inside the root div.
*/
