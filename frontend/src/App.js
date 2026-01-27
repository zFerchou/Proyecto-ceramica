import React from 'react';
import AppRoutes from '../src/routes/AppRoutes';
import { useEffect } from 'react';
import { setPrintDriver } from './services/PrintService';
import WebPrintDriver from './services/WebPrintDriver';

function App() {
  useEffect(() => {
    setPrintDriver(WebPrintDriver);
  }, []);
  return <AppRoutes />;
}

export default App;
