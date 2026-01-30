// app.js
let gameState = {
    diamonds: 100,
    wins: 0,
    losses: 0,
    streak: 0,
    user: null,
    skins: {},
    settings: {}
};

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM загружен, начинаем инициализацию...');
    
    try {
        // 1. Инициализируем Telegram
        if (typeof initTelegramWebApp === 'function') {
            gameState.user = initTelegramWebApp();
            console.log('Пользователь:', gameState.user);
            
            if (gameState.user) {
                document.getElementById('username').textContent = gameState.user.firstName;
            }
        }
        
        // 2. Загружаем состояние из localStorage
        loadGameState();
        
        // 3. Обновляем UI
        updateUI();
        
        // 4. Показываем главное меню через 1.5 секунды
        setTimeout(() => {
            const loadingScreen = document.getElementById('loading-screen');
            const mainMenu = document.getElementById('main-menu');
            
            if (loadingScreen) {
                loadingScreen.classList.add('hidden');
            }
            
            if (mainMenu) {
                mainMenu.classList.remove('hidden');
            }
            
            // Анимация прогресс-бара
            const progressBar = document.querySelector('.progress');
            if (progressBar) {
                progressBar.style.width = '100%';
            }
            
            console.log('Игра успешно загружена!');
        }, 1500);
        
    } catch (error) {
        console.error('Ошибка инициализации:', error);
        // В случае ошибки всё равно показываем меню
        setTimeout(() => {
            document.getElementById('loading-screen').classList.add('hidden');
            document.getElementById('main-menu').classList.remove('hidden');
        }, 1000);
    }
});

// Функции для работы с UI
function showScreen(screenId) {
    // Скрываем все экраны
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
    });
    
    // Показываем нужный экран
    const targetScreen = document.getElementById(screenId + '-screen') || 
                        document.getElementById(screenId);
    
    if (targetScreen) {
        targetScreen.classList.remove('hidden');
    }
    
    // Если показываем магазин или коллекцию, обновляем
    if (screenId === 'shop' || screenId === 'backpack') {
        updateShop();
    }
}

function updateUI() {
    // Обновляем алмазы
    const diamondElements = document.querySelectorAll('#diamond-count, #shop-balance');
    diamondElements.forEach(el => {
        if (el) el.textContent = gameState.diamonds;
    });
    
    // Обновляем статистику
    document.getElementById('stat-wins').textContent = gameState.wins;
    document.getElementById('stat-losses').textContent = gameState.losses;
    document.getElementById('stat-streak').textContent = gameState.streak;
}

function loadGameState() {
    try {
        const saved = localStorage.getItem('paperWinRockState');
        if (saved) {
            const parsed = JSON.parse(saved);
            gameState = { ...gameState, ...parsed };
        }
    } catch (error) {
        console.error('Ошибка загрузки состояния:', error);
    }
}

function saveGameState() {
    try {
        localStorage.setItem('paperWinRockState', JSON.stringify(gameState));
    } catch (error) {
        console.error('Ошибка сохранения состояния:', error);
    }
}

// Экспортируем для использования в других файлах
window.showScreen = showScreen;
window.gameState = gameState;
window.saveGameState = saveGameState;
window.updateUI = updateUI;

// Простые функции для кнопок (заглушки)
window.startGame = function(mode) {
    if (mode === 'bot') {
        showScreen('difficulty');
    }
};

window.startBotGame = function(difficulty) {
    console.log('Начинаем игру со сложностью:', difficulty);
    showScreen('battle');
    
    // Обновляем информацию о боте
    document.getElementById('battle-mode').textContent = 'БОЙ С БОТОМ';
    document.getElementById('player2-name').textContent = 'Бот';
    document.getElementById('player2-difficulty').textContent = 
        difficulty === 'easy' ? 'Новичок' : 
        difficulty === 'medium' ? 'Средний' : 'Эксперт';
    
    // Начинаем таймер раунда
    startRoundTimer();
};

window.makeChoice = function(choice) {
    console.log('Выбран:', choice);
    // Здесь будет логика выбора
    showScreen('result');
};

window.playAgain = function() {
    showScreen('difficulty');
};

