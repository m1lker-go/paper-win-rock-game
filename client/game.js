body {
  margin: 0;
  background: #121212;
  color: white;
  font-family: Arial, sans-serif;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

.screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.hidden {
  display: none;
}

button {
  background: orange;
  border: none;
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 16px;
  cursor: pointer;
}

.loader {
  width: 50px;
  height: 50px;
  border: 5px solid #333;
  border-top: 5px solid orange;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.arena {
  display: flex;
  gap: 40px;
  font-size: 64px;
}

.hand {
  transition: transform 0.5s ease;
}

#timer {
  font-size: 32px;
}

.choices {
  display: flex;
  gap: 12px;
}

.battle-buttons {
  position: fixed;
  bottom: 20px;
  display: flex;
  gap: 12px;
}
