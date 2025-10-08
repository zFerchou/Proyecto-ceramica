import React, { useState } from 'react';
import './App.css';
import InventoryPage from './components/InventoryPage';
import SalesPage from './components/SalesPage';

function App() {
  const [showInventory, setShowInventory] = useState(false);
  const [showSales, setShowSales] = useState(false);
  return (
    <div className="App">
      {!showInventory && !showSales ? (
        <header className="App-header">
          <h1>Home</h1>
          <button onClick={() => setShowInventory(true)}>Ir a Inventario</button>
          <button onClick={() => setShowSales(true)} style={{ marginLeft: 8 }}>Ir a Ventas</button>
        </header>
      ) : showInventory ? (
        <InventoryPage onClose={() => setShowInventory(false)} />
      ) : (
        <SalesPage onClose={() => setShowSales(false)} />
      )}
    </div>
  );
}

export default App;
