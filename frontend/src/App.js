import React, { useState } from 'react';
import './App.css';
import InventoryPage from './components/InventoryPage';

function App() {
  const [showInventory, setShowInventory] = useState(false);
  return (
    <div className="App">
      {!showInventory ? (
        <header className="App-header">
          <h1>Home</h1>
          <button onClick={() => setShowInventory(true)}>Ir a Inventario</button>
        </header>
      ) : (
        <InventoryPage onClose={() => setShowInventory(false)} />
      )}
    </div>
  );
}

export default App;
