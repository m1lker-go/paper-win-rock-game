// Минимальный рабочий код игры - адаптивный
let currentScreen = 'loading';
let userData = null;
let currentGame = null;
let gameTimer = null;

// Основная функция инициализации
function initGame() {
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
    
    // Создаем базовую структуру если её нет
    createGameStructure();
    
    // Запускаем прогресс-бар
    startLoading();
    
    // Через 2 секунды показываем главное меню
    setTimeout(() => {
        hideAllScreens();
        showScreen('main-menu');
        updateUserUI();
        console.log('Игра загружена!');
    }, 2000);
}

// Создание базовой структуры игры
function createGameStructure() {
    const body = document.body;
    
    // Проверяем и создаем необходимые экраны
    
    // Экран загрузки
    let loadingScreen = document.getElementById('loading-screen');
    if (!loadingScreen) {
        loadingScreen = document.createElement('div');
        loadingScreen.id = 'loading-screen';
        loadingScreen.className = 'screen active';
        loadingScreen.innerHTML = `
            <div class="loader">
                <div class="rocket">🚀</div>
                <div class="loading-text">Загрузка игры...</div>
                <div class="progress-bar">
                    <div class="progress"></div>
                </div>
            </div>
        `;
        body.appendChild(loadingScreen);
    }
    
    // Главное меню
    let mainMenu = document.getElementById('main-menu-screen');
    if (!mainMenu) {
        mainMenu = document.createElement('div');
        mainMenu.id = 'main-menu-screen';
        mainMenu.className = 'screen';
        mainMenu.innerHTML = `
            <div class="header">
                <div class="user-info">
                    <div class="avatar" id="user-avatar">👤</div>
                    <div class="user-details">
                        <h2 id="username">Игрок</h2>
                        <div class="diamonds">
                            <i class="fas fa-gem"></i>
                            <span id="diamond-count">100</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="menu-container">
                <div class="menu-buttons">
                    <button class="menu-btn battle-btn" onclick="startGame('bot')">
                        <i class="fas fa-robot"></i>
                        <span>ИГРАТЬ С БОТОМ</span>
                        <small>Быстрая игра</small>
                    </button>
                    <button class="menu-btn pvp-btn" onclick="startPvPSearch()">
                        <i class="fas fa-users"></i>
                        <span>PvP БИТВА</span>
                        <small>Против игроков</small>
                    </button>
                    <button class="menu-btn shop-btn" onclick="showScreen('shop')">
                        <i class="fas fa-shopping-cart"></i>
                        <span>МАГАЗИН</span>
                        <small>Купить скины</small>
                    </button>
                    <button class="menu-btn backpack-btn" onclick="showScreen('backpack')">
                        <i class="fas fa-backpack"></i>
                        <span>КОЛЛЕКЦИЯ</span>
                        <small>Твои скины</small>
                    </button>
                </div>
            </div>
        `;
        body.appendChild(mainMenu);
    }
    
    // Экран выбора сложности
    let difficultyScreen = document.getElementById('difficulty-screen');
    if (!difficultyScreen) {
        difficultyScreen = document.createElement('div');
        difficultyScreen.id = 'difficulty-screen';
        difficultyScreen.className = 'screen';
        difficultyScreen.innerHTML = `
            <div class="screen-header">
                <button class="back-btn" onclick="showScreen('main-menu')">
                    <i class="fas fa-arrow-left"></i>
                </button>
                <h2>ВЫБЕРИ СЛОЖНОСТЬ</h2>
            </div>
            <div class="difficulty-options">
                <button class="difficulty-btn easy" onclick="startBotGame('easy')">
                    <div class="difficulty-icon">😊</div>
                    <div class="difficulty-info">
                        <h3>НОВИЧОК</h3>
                        <p>Идеально для начала</p>
                        <div class="reward-info">Награда: +3 алмаза</div>
                    </div>
                </button>
                <button class="difficulty-btn medium" onclick="startBotGame('medium')">
                    <div class="difficulty-icon">😎</div>
                    <div class="difficulty-info">
                        <h3>ОПЫТНЫЙ</h3>
                        <p>Сбалансированная игра</p>
                        <div class="reward-info">Награда: +5 алмазов</div>
                    </div>
                </button>
                <button class="difficulty-btn hard" onclick="startBotGame('hard')">
                    <div class="difficulty-icon">🤖</div>
                    <div class="difficulty-info">
                        <h3>ЭКСПЕРТ</h3>
                        <p>Для настоящих чемпионов</p>
                        <div class="reward-info">Награда: +10 алмазов</div>
                    </div>
                </button>
            </div>
        `;
        body.appendChild(difficultyScreen);
    }
    
    // Экран боя
    let battleScreen = document.getElementById('battle-screen');
    if (!battleScreen) {
        battleScreen = document.createElement('div');
        battleScreen.id = 'battle-screen';
        battleScreen.className = 'screen';
        battleScreen.innerHTML = `
            <div class="battle-header">
                <button class="back-btn" onclick="showScreen('main-menu')">
                    <i class="fas fa-arrow-left"></i>
                </button>
                <h2 id="battle-mode">БОЙ С БОТОМ</h2>
                <div class="battle-timer">
                    <i class="fas fa-clock"></i>
                    <span id="round-timer">10</span>
                </div>
            </div>
            <div class="battle-content">
                <div class="players-container">
                    <div class="player-card you">
                        <div class="player-avatar" id="player1-avatar">👤</div>
                        <div class="player-name" id="player1-name">Вы</div>
                        <div class="player-choice" id="player1-choice">❓</div>
                    </div>
                    <div class="vs-container">
                        <div class="vs-text">VS</div>
                    </div>
                    <div class="player-card enemy">
                        <div class="player-avatar" id="player2-avatar">🤖</div>
                        <div class="player-name" id="player2-name">Бот</div>
                        <div class="player-choice" id="player2-choice">❓</div>
                    </div>
                </div>
                <div class="battle-log" id="battle-log">
                    <div class="log-entry">Выберите ваш ход!</div>
                </div>
                <div class="choices-container">
                    <button class="choice-btn rock-btn" onclick="makeChoice('rock')">
                        <div class="choice-skin" id="rock-skin">✊</div>
                        <div class="choice-name">КАМЕНЬ</div>
                    </button>
                    <button class="choice-btn paper-btn" onclick="makeChoice('paper')">
                        <div class="choice-skin" id="paper-skin">✋</div>
                        <div class="choice-name">БУМАГА</div>
                    </button>
                    <button class="choice-btn scissors-btn" onclick="makeChoice('scissors')">
                        <div class="choice-skin" id="scissors-skin">✌️</div>
                        <div class="choice-name">НОЖНИЦЫ</div>
                    </button>
                </div>
                <div class="battle-controls">
                    <button class="control-btn hint-btn" onclick="showHint()">
                        <i class="fas fa-lightbulb"></i> ПОДСКАЗКА
                    </button>
                    <button class="control-btn surrender-btn" onclick="surrender()">
                        <i class="fas fa-flag"></i> СДАЮСЬ
                    </button>
                </div>
            </div>
        `;
        body.appendChild(battleScreen);
    }
    
    // Экран результата
    let resultScreen = document.getElementById('result-screen');
    if (!resultScreen) {
        resultScreen = document.createElement('div');
        resultScreen.id = 'result-screen';
        resultScreen.className = 'screen';
        resultScreen.innerHTML = `
            <div class="result-content">
                <div class="result-title" id="result-title">ПОБЕДА!</div>
                <div class="result-icon" id="result-icon">🏆</div>
                <div class="result-details">
                    <div class="result-message" id="result-message">Вы обыграли бота!</div>
                    <div class="result-reward">
                        <i class="fas fa-gem"></i>
                        <span id="reward-amount">+5 алмазов</span>
                    </div>
                </div>
                <div class="result-buttons">
                    <button class="result-btn play-again" onclick="playAgain()">
                        <i class="fas fa-redo"></i> ИГРАТЬ СНОВА
                    </button>
                    <button class="result-btn menu" onclick="showScreen('main-menu')">
                        <i class="fas fa-home"></i> В МЕНЮ
                    </button>
                </div>
            </div>
        `;
        body.appendChild(resultScreen);
    }
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

// Скрыть все экраны
function hideAllScreens() {
    const allScreens = document.querySelectorAll('.screen');
    allScreens.forEach(screen => {
        screen.classList.remove('active');
    });
}

// Показать экран (адаптивная версия)
function showScreen(screenId) {
    console.log('Переход на экран:', screenId);
    
    hideAllScreens();
    
    // Ищем экран по ID
    let screen = document.getElementById(screenId + '-screen');
    if (!screen) {
        // Пробуем без суффикса
        screen = document.getElementById(screenId);
    }
    
    if (screen) {
        screen.classList.add('active');
        currentScreen = screenId;
    } else {
        console.error('Экран не найден:', screenId);
        // Создаем экран динамически
        createScreen(screenId);
        // Пробуем снова
        setTimeout(() => showScreen(screenId), 100);
    }
}

// Создать экран динамически
function createScreen(screenId) {
    console.log('Создаем экран:', screenId);
    
    const screen = document.createElement('div');
    screen.id = screenId + '-screen';
    screen.className = 'screen';
    screen.innerHTML = `
        <div class="screen-header">
            <button class="back-btn" onclick="showScreen('main-menu')">
                <i class="fas fa-arrow-left"></i>
            </button>
            <h2>${screenId.toUpperCase()}</h2>
        </div>
        <div style="padding: 20px; text-align: center;">
            <p>Экран "${screenId}" в разработке</p>
            <button onclick="showScreen('main-menu')" style="
                background: #ff9f43;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 10px;
                margin-top: 20px;
                cursor: pointer;
            ">Вернуться в меню</button>
        </div>
    `;
    document.body.appendChild(screen);
}

// Обновить UI пользователя
function updateUserUI() {
    if (!userData) return;
    
    const usernameElement = document.getElementById('username');
    const diamondElement = document.getElementById('diamond-count');
    
    if (usernameElement) usernameElement.textContent = userData.username;
    if (diamondElement) diamondElement.textContent = userData.diamonds;
}

// Начать игру с ботом
function startGame(type) {
    if (type === 'bot') {
        showScreen('difficulty');
    }
}

// Начать игру с определенной сложностью
function startBotGame(difficulty) {
    console.log('Сложность:', difficulty);
    
    const botNames = {
        easy: ['Новичок', 'Ученик', 'Начинающий'],
        medium: ['Опытный', 'Ветеран', 'Мастер'],
        hard: ['Эксперт', 'Чемпион', 'Босс']
    };
    
    const names = botNames[difficulty];
    const botName = names[Math.floor(Math.random() * names.length)];
    
    currentGame = {
        id: 'game_' + Date.now(),
        bot: {
            name: botName,
            difficulty: difficulty
        },
        status: 'playing'
    };
    
    const battleTitle = document.getElementById('battle-mode');
    const enemyName = document.getElementById('player2-name');
    
    if (battleTitle) battleTitle.textContent = 'БОЙ С БОТОМ';
    if (enemyName) enemyName.textContent = botName;
    
    clearBattleLog();
    addLogEntry('Начинаем бой с ботом! Сделайте ваш ход.');
    
    showScreen('battle');
    startBattleTimer();
}

// Сделать ход
function makeChoice(choice) {
    if (!currentGame) return;
    
    console.log('Игрок выбрал:', choice);
    
    const playerChoice = document.getElementById('player1-choice');
    if (playerChoice) {
        playerChoice.textContent = getChoiceEmoji(choice);
    }
    
    addLogEntry(`Вы выбрали: ${getChoiceName(choice)}`);
    
    setTimeout(() => {
        botMakeChoice(choice);
    }, 1000);
}

// Бот делает ход
function botMakeChoice(playerChoice) {
    if (!currentGame) return;
    
    const choices = ['rock', 'paper', 'scissors'];
    let botChoice;
    const difficulty = currentGame.bot.difficulty;
    const random = Math.random();
    
    if (difficulty === 'easy') {
        botChoice = choices[Math.floor(Math.random() * 3)];
    } else if (difficulty === 'medium') {
        if (random < 0.4) {
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
    
    const botChoiceElement = document.getElementById('player2-choice');
    if (botChoiceElement) {
        botChoiceElement.textContent = getChoiceEmoji(botChoice);
    }
    
    addLogEntry(`Бот выбрал: ${getChoiceName(botChoice)}`);
    
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
        showResult('win', playerChoice, botChoice);
        updateUserStats(true);
    } else {
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
    
    if (reward) {
        userData.diamonds += reward;
        updateUserUI();
    }
    
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
            if (time <= 5) {
                timerElement.style.color = '#ff6b6b';
            } else {
                timerElement.style.color = '#fff';
            }
        }
        
        if (time <= 0) {
            stopBattleTimer();
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

// Другие функции
function showHint() {
    alert('Камень бьёт ножницы, ножницы бьют бумагу, бумага бьёт камень!');
}

function startPvPSearch() {
    alert('PvP режим в разработке. Играйте с ботом!');
    showScreen('main-menu');
}

function cancelSearch() {
    showScreen('main-menu');
}

function showSettings() {
    alert('Настройки в разработке');
}

function copyReferalLink() {
    const link = window.location.href;
    navigator.clipboard.writeText(link)
        .then(() => alert('Ссылка скопирована!'))
        .catch(() => alert('Не удалось скопировать ссылку'));
}

function playAgain() {
    showScreen('difficulty');
}

function shareResult() {
    alert('Поделитесь игрой с друзьями!');
}

function surrender() {
    if (confirm('Вы уверены, что хотите сдаться?')) {
        alert('Вы сдались. Попробуйте снова!');
        showScreen('main-menu');
        stopBattleTimer();
    }
}

function changeSkin(type) {
    alert('Смена скина в разработке');
}

// Привязать функции к window
window.initGame = initGame;
window.showScreen = showScreen;
window.startGame = startGame;
window.startBotGame = startBotGame;
window.makeChoice = makeChoice;
window.showHint = showHint;
window.startPvPSearch = startPvPSearch;
window.cancelSearch = cancelSearch;
window.showSettings = showSettings;
window.changeSkin = changeSkin;
window.copyReferalLink = copyReferalLink;
window.playAgain = playAgain;
window.shareResult = shareResult;
window.surrender = surrender;

// Запустить игру
document.addEventListener('DOMContentLoaded', initGame);
