// Проверяем, находимся ли мы в Telegram WebView
function isTelegramWebView() {
  return window.Telegram && window.Telegram.WebApp;
}

// Инициализация Telegram WebApp
function initTelegram() {
  if (!isTelegramWebView()) {
    console.log("Not in Telegram WebView");
    return false;
  }

  const tg = window.Telegram.WebApp;
  
  // Разворачиваем на весь экран
  tg.expand();
  
  // Получаем данные пользователя
  const user = tg.initDataUnsafe?.user;
  
  // Если есть пользователь, можно отобразить его данные
  if (user) {
    console.log("User:", user);
    // Можно добавить приветствие в игре
    // document.getElementById('welcome').textContent = `Привет, ${user.first_name}!`;
  }
  
  // Отправка данных в бота
  window.sendToTelegram = function(data) {
    if (isTelegramWebView()) {
      tg.sendData(JSON.stringify(data));
    }
  };
  
  // Закрытие WebView
  window.closeTelegram = function() {
    if (isTelegramWebView()) {
      tg.close();
    }
  };
  
  return true;
}

// Отправка результатов игры
function sendGameResult(result, score) {
  if (isTelegramWebView()) {
    const data = {
      action: 'game_result',
      result: result,
      score: score,
      timestamp: Date.now()
    };
    
    window.Telegram.WebApp.sendData(JSON.stringify(data));
    
    // Также можно показать всплывающее окно с результатами
    window.Telegram.WebApp.showAlert(`Ваш результат: ${result}! Счет: ${score}`);
  }
}

// Открытие магазина в Telegram
function openTelegramShop() {
  if (isTelegramWebView()) {
    // Отправляем команду боту для открытия магазина
    window.Telegram.WebApp.sendData(JSON.stringify({
      action: 'open_shop'
    }));
  }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  if (initTelegram()) {
    console.log('Telegram WebApp initialized');
    
    // Добавляем обработчик для кнопки "Спасибо" чтобы закрыть WebView
    const toMenuBtn = document.getElementById('toMenu');
    if (toMenuBtn) {
      toMenuBtn.addEventListener('click', () => {
        setTimeout(() => {
          window.closeTelegram();
        }, 1000);
      });
    }
    
    // Модифицируем конец боя для отправки результатов в Telegram
    const originalEndBattle = window.endBattle; // Сохраняем оригинальную функцию
    window.endBattle = function() {
      // Вызываем оригинальную логику
      originalEndBattle?.apply(this, arguments);
      
      // Отправляем результаты в Telegram
      const goldElement = document.getElementById('gold');
      const gold = parseInt(goldElement.textContent.match(/\d+/)[0]);
      
      sendGameResult('completed', gold);
    };
  }
});

// Экспортируем функции для использования в других файлах
window.TelegramAPI = {
  initTelegram,
  sendGameResult,
  openTelegramShop,
  closeTelegram: window.closeTelegram
};