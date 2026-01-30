// Минимальный рабочий код игры
let currentScreen = 'loading';
let userData = null;
let currentGame = null;
let gameTimer = null;

// Основная функция инициализации
async function initGame() {
    console.log('Инициализация игры...');
    
    // Создаем тестового пользователя
    userData = {
        id: 'user_' + Date.now(),
        username: 'Игрок',
        diamonds: 100,
        wins: 0,
        losses: 0,
        stats: {
            winStreak: 0,
            bestWinStreak: 0,
            totalGames: 0
        }
    };
    
    // Запускаем прогресс-бар
    startLoading();
    
    // Через 2 секунды показываем главное меню
    setTimeout(() => {
        showScreen('main-menu');
        updateUserUI();
        console.log('Игра загружена!');
    }, 2000);
}

// Функция загрузки
function startLoading() {
    const progressBar = document.querySelector('.progress');
    if (progressBar) {
        let width = 0;
        const interval = setInterval(() => {
            if (width >= 100) {
                clearInterval(interval);
                return;
            }
            width += 2;
            progressBar.style.width = width + '%';
        }, 30);
    }
}

// Показать экран
function showScreen(screenId) {
    console.log('Переход на экран:', screenId);
    
    // Скрыть все экраны
    const allScreens = document.querySelectorAll('.screen');
    allScreens.forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Показать нужный экран
    const targetScreen = document.getElementById(screenId + '-screen');
    if (targetScreen) {
        targetScreen.classList.add('active');
        currentScreen = screenId;
    } else {
        console.error('Экран не найден:', screenId);
    }
}

// Обновить UI пользователя
function updateUserUI() {
    if (!userData) return;
    
    // Обновить имя
    const usernameElement = document.getElementById('username');
    if (usernameElement) {
        usernameElement.textContent = userData.username;
    }
    
    // Обновить алмазы
    const diamondElement = document.getElementById('diamond-count');
    if (diamondElement) {
        diamondElement.textContent = userData.diamonds;
    }
    
    // Обновить статистику
    updateStats();
}

// Обновить статистику
function updateStats() {
    if (!userData) return;
    
    const winsElement = document.getElementById('stat-wins');
    const lossesElement = document.getElementById('stat-losses');
    const streakElement = document.getElementById('stat-streak');
    
    if (winsElement) winsElement.textContent = userData.wins;
    if (lossesElement) lossesElement.textContent = userData.losses;
    if (streakElement) streakElement.textContent = userData.stats.winStreak;
}

// Начать игру с ботом
function startGame(type) {
    console.log('Начало игры:', type);
    
    if (type === 'bot') {
        showScreen('difficulty');
    }
}

// Начать игру с определенной сложностью
function startBotGame(difficulty) {
    console.log('Сложность:', difficulty);
    
    // Создаем бота
    const botNames = {
        easy: ['Новичок', 'Ученик', 'Начинающий'],
        medium: ['Опытный', 'Ветеран', 'Мастер'],
        hard: ['Эксперт', 'Чемпион', 'Босс']
    };
    
    const names = botNames[difficulty];
    const botName = names[Math.floor(Math.random() * names.length)];
    
    // Настройка игры
    currentGame = {
        id: 'game_' + Date.now(),
        bot: {
            name: botName,
            difficulty: difficulty
        },
        status: 'playing'
    };
    
    // Обновляем UI
    const battleTitle = document.getElementById('battle-mode');
    const enemyName = document.getElementById('player2-name');
    const enemyDifficulty = document.getElementById('player2-difficulty');
    
    if (battleTitle) battleTitle.textContent = 'БОЙ С БОТОМ';
    if (enemyName) enemyName.textContent = botName;
    if (enemyDifficulty) enemyDifficulty.textContent = 
        difficulty === 'easy' ? 'Новичок' : 
        difficulty === 'medium' ? 'Средний' : 'Эксперт';
    
    // Очищаем лог
    clearBattleLog();
    addLogEntry('Начинаем бой с ботом! Сделайте ваш ход.');
    
    // Показываем экран боя
    showScreen('battle');
    startBattleTimer();
}

// Сделать ход
function makeChoice(choice) {
    if (!currentGame) return;
    
    console.log('Игрок выбрал:', choice);
    
    // Отображаем выбор игрока
    const playerChoice = document.getElementById('player1-choice');
    if (playerChoice) {
        playerChoice.textContent = getChoiceEmoji(choice);
        playerChoice.style.fontSize = '3rem';
    }
    
    addLogEntry(`Вы выбрали: ${getChoiceName(choice)}`);
    
    // Бот делает ход
    setTimeout(() => {
        botMakeChoice(choice);
    }, 1000);
}

// Бот делает ход
function botMakeChoice(playerChoice) {
    if (!currentGame) return;
    
    const choices = ['rock', 'paper', 'scissors'];
    let botChoice;
    
    // Логика сложности бота
    const difficulty = currentGame.bot.difficulty;
    const random = Math.random();
    
    if (difficulty === 'easy') {
        // Легкий бот - случайный выбор
        botChoice = choices[Math.floor(Math.random() * 3)];
    } else if (difficulty === 'medium') {
        // Средний бот - иногда делает правильный ход
        if (random < 0.4) {
            // Делает выигрышный ход
            const winningMoves = {
                rock: 'paper',
                paper: 'scissors',
                scissors: 'rock'
            };
            botChoice = winningMoves[playerChoice];
        } else {
            botChoice = choices[Math.floor(Math.random() * 3)];
        }
    } else {
        // Сложный бот - часто делает правильный ход
        if (random < 0.7) {
            const winningMoves = {
                rock: 'paper',
                paper: 'scissors',
                scissors: 'rock'
            };
            botChoice = winningMoves[playerChoice];
        } else {
            botChoice = choices[Math.floor(Math.random() * 3)];
        }
    }
    
    console.log('Бот выбрал:', botChoice);
    
    // Отображаем выбор бота
    const botChoiceElement = document.getElementById('player2-choice');
    if (botChoiceElement) {
        botChoiceElement.textContent = getChoiceEmoji(botChoice);
        botChoiceElement.style.fontSize = '3rem';
    }
    
    addLogEntry(`Бот выбрал: ${getChoiceName(botChoice)}`);
    
    // Определяем победителя
    setTimeout(() => {
        determineWinner(playerChoice, botChoice);
    }, 1000);
}

// Определить победителя
function determineWinner(playerChoice, botChoice) {
    if (playerChoice === botChoice) {
        showResult('draw', playerChoice, botChoice);
        return;
    }
    
    const rules = {
        rock: 'scissors',
        scissors: 'paper',
        paper: 'rock'
    };
    
    if (rules[playerChoice] === botChoice) {
        // Игрок победил
        showResult('win', playerChoice, botChoice);
        updateUserStats(true);
    } else {
        // Бот победил
        showResult('lose', playerChoice, botChoice);
        updateUserStats(false);
    }
}

// Показать результат
function showResult(result, playerChoice, botChoice) {
    stopBattleTimer();
    
    let title, icon, message, reward;
    
    switch (result) {
        case 'win':
            title = 'ПОБЕДА!';
            icon = '🏆';
            message = 'Вы обыграли бота!';
            reward = currentGame.bot.difficulty === 'easy' ? 3 : 
                     currentGame.bot.difficulty === 'medium' ? 5 : 10;
            break;
        case 'lose':
            title = 'ПОРАЖЕНИЕ';
            icon = '💔';
            message = 'Бот оказался сильнее.';
            reward = 1;
            break;
        case 'draw':
            title = 'НИЧЬЯ!';
            icon = '🤝';
            message = 'Ничья! Попробуйте снова.';
            reward = 2;
            break;
    }
    
    // Обновляем UI результата
    const resultTitle = document.getElementById('result-title');
    const resultIcon = document.getElementById('result-icon');
    const resultMessage = document.getElementById('result-message');
    const rewardAmount = document.getElementById('reward-amount');
    const yourChoice = document.getElementById('your-choice');
    const enemyChoice = document.getElementById('enemy-choice');
    
    if (resultTitle) resultTitle.textContent = title;
    if (resultIcon) resultIcon.textContent = icon;
    if (resultMessage) resultMessage.textContent = message;
    if (rewardAmount) rewardAmount.textContent = `+${reward} алмазов`;
    if (yourChoice) yourChoice.textContent = `${getChoiceEmoji(playerChoice)} ${getChoiceName(playerChoice)}`;
    if (enemyChoice) enemyChoice.textContent = `${getChoiceEmoji(botChoice)} ${getChoiceName(botChoice)}`;
    
    // Обновляем алмазы
    if (reward) {
        userData.diamonds += reward;
        updateUserUI();
    }
    
    // Показываем экран результата через 1 секунду
    setTimeout(() => {
        showScreen('result');
    }, 1000);
}

// Обновить статистику пользователя
function updateUserStats(isWin) {
    if (isWin) {
        userData.wins += 1;
        userData.stats.winStreak += 1;
        if (userData.stats.winStreak > userData.stats.bestWinStreak) {
            userData.stats.bestWinStreak = userData.stats.winStreak;
        }
    } else {
        userData.losses += 1;
        userData.stats.winStreak = 0;
    }
    userData.stats.totalGames += 1;
    updateStats();
}

// Вспомогательные функции
function getChoiceEmoji(choice) {
    const emojis = {
        rock: '✊',
        paper: '✋',
        scissors: '✌️'
    };
    return emojis[choice] || '❓';
}

function getChoiceName(choice) {
    const names = {
        rock: 'Камень',
        paper: 'Бумага',
        scissors: 'Ножницы'
    };
    return names[choice] || 'Неизвестно';
}

// Таймер боя
function startBattleTimer() {
    let time = 10;
    const timerElement = document.getElementById('round-timer');
    
    if (gameTimer) clearInterval(gameTimer);
    
    gameTimer = setInterval(() => {
        time--;
        if (timerElement) {
            timerElement.textContent = time;
            
            // Изменение цвета при малом времени
            if (time <= 5) {
                timerElement.style.color = '#ff6b6b';
            } else {
                timerElement.style.color = '#fff';
            }
        }
        
        if (time <= 0) {
            stopBattleTimer();
            // Автоматический выбор при тайм-ауте
            const choices = ['rock', 'paper', 'scissors'];
            const autoChoice = choices[Math.floor(Math.random() * 3)];
            makeChoice(autoChoice);
            addLogEntry('Время вышло! Сделан случайный выбор.');
        }
    }, 1000);
}

function stopBattleTimer() {
    if (gameTimer) {
        clearInterval(gameTimer);
        gameTimer = null;
    }
}

// Боевой лог
function clearBattleLog() {
    const log = document.getElementById('battle-log');
    if (log) {
        log.innerHTML = '';
    }
}

function addLogEntry(text) {
    const log = document.getElementById('battle-log');
    if (log) {
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.textContent = text;
        log.appendChild(entry);
        log.scrollTop = log.scrollHeight;
    }
}

// Простые функции для магазина и заданий (заглушки)
function showShopTab(tab) {
    console.log('Показать вкладку магазина:', tab);
    showNotification('Магазин в разработке');
}

function showCollectionTab(tab) {
    console.log('Показать вкладку коллекции:', tab);
    showNotification('Коллекция в разработке');
}

function loadTasks() {
    console.log('Загрузка заданий');
    showNotification('Задания в разработке');
}

function copyReferalLink() {
    const link = window.location.href;
    navigator.clipboard.writeText(link)
        .then(() => showNotification('Ссылка скопирована!'))
        .catch(() => showNotification('Не удалось скопировать ссылку'));
}

// Уведомления
function showNotification(text) {
    const notification = document.getElementById('notification');
    const textElement = document.getElementById('notification-text');
    
    if (notification && textElement) {
        textElement.textContent = text;
        notification.classList.remove('hidden');
        
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 3000);
    }
}

// Подсказка
function showHint() {
    showNotification('Камень бьёт ножницы, ножницы бьют бумагу, бумага бьёт камень!');
}

function closeHint() {
    // Просто скрываем уведомление
}

// Настройки
function showSettings() {
    showNotification('Настройки в разработке');
}

// Поиск PvP
function startPvPSearch() {
    showScreen('pvp-search');
    
    let time = 15;
    const timerElement = document.getElementById('search-timer');
    
    const searchTimer = setInterval(() => {
        time--;
        if (timerElement) {
            timerElement.textContent = time;
        }
        
        if (time <= 0) {
            clearInterval(searchTimer);
            showNotification('Противник не найден. Попробуйте снова.');
            showScreen('main-menu');
        }
    }, 1000);
    
    // Симулируем поиск 3 секунды, затем отменяем
    setTimeout(() => {
        clearInterval(searchTimer);
        showNotification('Противник найден! Переходим к бою...');
        setTimeout(() => startBotGame('medium'), 1000);
    }, 3000);
}

function cancelSearch() {
    showScreen('main-menu');
}

// Играть снова
function playAgain() {
    showScreen('difficulty');
}

// Поделиться результатом
function shareResult() {
    showNotification('Поделитесь игрой с друзьями!');
}

// Сдаться
function surrender() {
    if (confirm('Вы уверены, что хотите сдаться?')) {
        showNotification('Вы сдались. Попробуйте снова!');
        showScreen('main-menu');
        stopBattleTimer();
    }
}

// Изменить скин
function changeSkin(type) {
    showNotification('Смена скина в разработке');
}

// Привязать функции к window, чтобы они были доступны из HTML
window.initGame = initGame;
window.showScreen = showScreen;
window.startGame = startGame;
window.startBotGame = startBotGame;
window.makeChoice = makeChoice;
window.showHint = showHint;
window.closeHint = closeHint;
window.startPvPSearch = startPvPSearch;
window.cancelSearch = cancelSearch;
window.showSettings = showSettings;
window.changeSkin = changeSkin;
window.copyReferalLink = copyReferalLink;
window.loadTasks = loadTasks;
window.showShopTab = showShopTab;
window.showCollectionTab = showCollectionTab;
window.playAgain = playAgain;
window.shareResult = shareResult;
window.surrender = surrender;

// Запустить игру при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM загружен, запускаем игру...');
    initGame();
});
