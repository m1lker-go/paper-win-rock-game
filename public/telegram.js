// telegram.js
let tg = null;
let isTelegram = false;

function initTelegramWebApp() {
    try {
        // Проверяем, находимся ли мы в Telegram
        if (window.Telegram && Telegram.WebApp) {
            tg = Telegram.WebApp;
            
            // Инициализируем
            tg.ready();
            
            // Расширяем на весь экран
            tg.expand();
            
            // Устанавливаем цвета
            tg.setHeaderColor('#1c1c1c');
            tg.setBackgroundColor('#121212');
            
            // Получаем данные пользователя
            const user = tg.initDataUnsafe?.user;
            
            isTelegram = true;
            console.log('Telegram Web App инициализирован');
            
            if (user) {
                return {
                    id: user.id,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    username: user.username,
                    isPremium: user.is_premium || false
                };
            }
        }
    } catch (error) {
        console.error('Ошибка инициализации Telegram Web App:', error);
    }
    
    // Возвращаем тестовые данные для локальной разработки
    return {
        id: Date.now(),
        firstName: 'Игрок',
        lastName: 'Тестовый',
        username: 'testplayer',
        isPremium: false
    };
}

// Экспортируем функцию
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initTelegramWebApp };
}
