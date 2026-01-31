// Конфигурация игры
const CONFIG = {
    SEARCH_TIMEOUT: 15000,
    BATTLE_TIMEOUT: 10000,
    ANIMATION_DURATION: 2000,
    RESULT_DELAY: 3000,
    REWARD_WIN: 15,
    REWARD_DRAW: 5,
    REWARD_BOT_WIN: 10,
    REWARD_BOT_DRAW: 2,
    REFERRAL_REWARD_NORMAL: 50,
    REFERRAL_REWARD_PREMIUM: 250,
    BOT_USERNAME: 'PaperWinRock_bot'
};

// Состояние игры
const gameState = {
    diamonds: 0,
    wins: 0,
    losses: 0,
    streak: 0,
    battles: 0,
    referrals: 0,
    referralBonus: 0,
    currentGame: null,
    searchTimer: null,
    battleTimer: null,
    user: null,
    referralCode: null,
    socket: null,
    isPvP: false,
    currentPvPGame: null
};

// Инициализация игры
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎮 Paper Win Rock загружается...');
    
    loadGameState();
    initTelegram();
    initSocket();
    updateUI();
    
    setTimeout(function() {
        document.getElementById('loading-screen').classList.add('hidden');
        document.getElementById('main-menu').classList.remove('hidden');
        console.log('✅ Игра готова!');
    }, 2000);
});

// Инициализация Telegram Web App
function initTelegram() {
    try {
        if (window.Telegram && Telegram.WebApp) {
            Telegram.WebApp.ready();
            Telegram.WebApp.expand();
            
            const user = Telegram.WebApp.initDataUnsafe?.user;
            if (user) {
                document.getElementById('user-avatar').innerHTML = 
                    `<img src="assets/icons/avatar.png" alt="${user.first_name || 'Игрок'}">`;
                document.getElementById('username').textContent = user.first_name || 'Игрок';
                
                gameState.user = user;
                
                // Генерируем реферальный код
                if (user.id) {
                    gameState.referralCode = `PWR_${user.id}`;
                    updateReferralLink();
                }
                
                console.log('🤖 Telegram пользователь:', user);
                
                // Загружаем статистику с сервера
                loadUserStats();
            }
        }
    } catch (error) {
        console.error('Ошибка инициализации Telegram:', error);
        gameState.user = { id: Date.now(), first_name: 'Игрок' };
        gameState.referralCode = `PWR_TEST_${Date.now()}`;
        updateReferralLink();
        loadUserStats();
    }
}

// Инициализация WebSocket
function initSocket() {
    try {
        const socket = io();
        gameState.socket = socket;
        
        socket.on('connect', () => {
            console.log('🔗 Подключено к WebSocket серверу');
        });
        
        socket.on('pvpQueueJoined', (data) => {
            console.log('В очереди PvP:', data);
            document.getElementById('search-status').textContent = 
                `В очереди. Позиция: ${data.position}`;
        });
        
        socket.on('pvpMatchFound', (data) => {
            console.log('Найден противник:', data);
            clearTimeout(gameState.searchTimer);
            
            gameState.currentPvPGame = {
                id: data.gameId,
                opponentId: data.opponentId,
                opponentName: data.opponentName,
                playerChoice: null,
                opponentChoice: null
            };
            
            document.getElementById('opponent-name').textContent = data.opponentName;
            document.getElementById('battle-type').textContent = 'PvP БИТВА';
            document.getElementById('search-status').textContent = 'Противник найден!';
            
            setTimeout(() => {
                showScreen('battle');
                startBattleTimer();
            }, 1000);
        });
        
        socket.on('opponentMoved', (data) => {
            console.log('Противник сделал ход:', data);
            document.getElementById('battle-log').innerHTML += 
                '<div class="log-entry">Противник сделал ход!</div>';
        });
        
        socket.on('pvpGameResult', (data) => {
            console.log('Результат PvP игры:', data);
            processPvPResult(data);
        });
        
        socket.on('error', (data) => {
            console.error('WebSocket ошибка:', data);
            showNotification(data.message || 'Ошибка соединения');
        });
        
        socket.on('disconnect', () => {
            console.log('🔌 Отключено от WebSocket сервера');
            showNotification('Потеряно соединение с сервером');
        });
    } catch (error) {
        console.error('Ошибка инициализации WebSocket:', error);
    }
}

// Загрузка статистики пользователя
async function loadUserStats() {
    if (!gameState.user || !gameState.user.id) return;
    
    try {
        const response = await fetch(`/api/user/${gameState.user.id}`);
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                gameState.diamonds = data.gold || 0;
                gameState.wins = data.wins || 0;
                gameState.losses = data.losses || 0;
                gameState.battles = data.gamesPlayed || 0;
                updateUI();
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
    }
}

// Обновление реферальной ссылки
function updateReferralLink() {
    if (gameState.referralCode) {
        const botLink = `https://t.me/${CONFIG.BOT_USERNAME}?start=${gameState.referralCode}`;
        document.getElementById('referral-link').value = botLink;
    }
}

// Копирование реферальной ссылки
function copyReferralLink() {
    const referralInput = document.getElementById('referral-link');
    referralInput.select();
    
    try {
        navigator.clipboard.writeText(referralInput.value).then(function() {
            showNotification('Ссылка скопирована!');
            const copyBtn = document.getElementById('copy-btn');
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fas fa-check"></i> СКОПИРОВАНО!';
            copyBtn.style.background = 'linear-gradient(135deg, #4CAF50, #2E7D32)';
            
            setTimeout(function() {
                copyBtn.innerHTML = originalText;
                copyBtn.style.background = 'linear-gradient(135deg, #9d4edd, #7b2cbf)';
            }, 2000);
        });
    } catch (err) {
        document.execCommand('copy');
        showNotification('Ссылка скопирована!');
    }
}

// Поделиться реферальной ссылкой
function shareReferralLink() {
    if (!gameState.referralCode) return;
    
    const botLink = `https://t.me/${CONFIG.BOT_USERNAME}?start=${gameState.referralCode}`;
    const shareText = `🎮 Присоединяйся к Paper Win Rock!\n\nИграй в PvP "Камень-Ножницы-Бумага"!\n\nТвоя реферальная ссылка: ${botLink}`;
    
    if (window.Telegram && Telegram.WebApp) {
        if (Telegram.WebApp.openTelegramLink) {
            Telegram.WebApp.openTelegramLink(botLink);
        } else {
            const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(botLink)}&text=${encodeURIComponent(shareText)}`;
            window.open(shareUrl, '_blank');
        }
        showNotification('Открываю Telegram для отправки...');
    } else if (navigator.share) {
        navigator.share({
            title: 'Paper Win Rock',
            text: shareText,
            url: botLink
        });
    } else {
        copyReferralLink();
    }
}

// Загрузка состояния
function loadGameState() {
    try {
        const saved = localStorage.getItem('paperWinRockState');
        if (saved) {
            const parsed = JSON.parse(saved);
            gameState.diamonds = parsed.diamonds || 0;
            gameState.wins = parsed.wins || 0;
            gameState.losses = parsed.losses || 0;
            gameState.streak = parsed.streak || 0;
            gameState.battles = parsed.battles || 0;
            gameState.referrals = parsed.referrals || 0;
            gameState.referralBonus = parsed.referralBonus || 0;
        }
    } catch (error) {
        console.error('Ошибка загрузки состояния:', error);
    }
}

// Сохранение состояния
function saveGameState() {
    try {
        localStorage.setItem('paperWinRockState', JSON.stringify(gameState));
    } catch (error) {
        console.error('Ошибка сохранения состояния:', error);
    }
}

// Обновление интерфейса
function updateUI() {
    document.getElementById('total-diamonds').textContent = gameState.diamonds;
    document.getElementById('wins-count').textContent = gameState.wins;
    document.getElementById('battles-count').textContent = gameState.battles;
    document.getElementById('streak-count').textContent = gameState.streak;
    document.getElementById('referrals-count').textContent = gameState.referrals;
}

// Функции навигации
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
    });
    
    const targetScreen = document.getElementById(screenId + '-screen') || 
                        document.getElementById(screenId);
    
    if (targetScreen) {
        targetScreen.classList.remove('hidden');
    }
    
    // Останавливаем таймеры
    if (screenId !== 'battle' && gameState.battleTimer) {
        clearInterval(gameState.battleTimer);
        gameState.battleTimer = null;
    }
    
    if (screenId !== 'search' && gameState.searchTimer) {
        clearInterval(gameState.searchTimer);
        gameState.searchTimer = null;
    }
}

// Начать поиск PvP
function startPvPSearch() {
    if (!gameState.user || !gameState.socket) {
        showNotification('Ошибка подключения. Обновите страницу.');
        return;
    }
    
    showScreen('search');
    gameState.isPvP = true;
    
    document.getElementById('search-status').textContent = 'Поиск противника...';
    
    // Отправляем запрос на поиск PvP
    gameState.socket.emit('joinPvPQueue', {
        userId: gameState.user.id,
        userName: gameState.user.first_name || 'Игрок'
    });
    
    // Таймаут поиска
    gameState.searchTimer = setTimeout(function() {
        if (gameState.socket) {
            gameState.socket.emit('cancelPvPQueue', gameState.user.id);
        }
        showNotification('Не удалось найти противника');
        showScreen('main-menu');
    }, CONFIG.SEARCH_TIMEOUT);
}

// Отмена поиска
function cancelSearch() {
    if (gameState.searchTimer) {
        clearInterval(gameState.searchTimer);
        gameState.searchTimer = null;
    }
    
    if (gameState.socket && gameState.user) {
        gameState.socket.emit('cancelPvPQueue', gameState.user.id);
    }
    
    showScreen('main-menu');
}

// Начать бой с ботом
function startBattleWithBot() {
    gameState.isPvP = false;
    const botNames = ['🤖 Бот-Профи', '🤖 ИИ-Мастер', '🤖 Робот3000'];
    const botName = botNames[Math.floor(Math.random() * botNames.length)];
    
    document.getElementById('opponent-name').textContent = botName;
    document.getElementById('battle-type').textContent = 'БОЙ С БОТОМ';
    
    initBattle('bot');
}

// Инициализация боя
function initBattle(mode) {
    showScreen('battle');
    
    gameState.currentGame = {
        mode: mode,
        playerChoice: null,
        opponentChoice: null
    };
    
    document.getElementById('battle-log').innerHTML = '<div class="log-entry">Выберите ваш ход!</div>';
    resetBattleDisplay();
    startBattleTimer();
}

// Таймер боя
function startBattleTimer() {
    let timeLeft = CONFIG.BATTLE_TIMEOUT / 1000;
    document.getElementById('battle-timer').textContent = timeLeft;
    
    if (gameState.battleTimer) {
        clearInterval(gameState.battleTimer);
    }
    
    gameState.battleTimer = setInterval(function() {
        timeLeft--;
        document.getElementById('battle-timer').textContent = timeLeft;
        
        if (timeLeft <= 0) {
            clearInterval(gameState.battleTimer);
            if (!gameState.currentGame.playerChoice) {
                const choices = ['rock', 'paper', 'scissors'];
                const randomChoice = choices[Math.floor(Math.random() * choices.length)];
                makeChoice(randomChoice);
            }
        }
    }, 1000);
}

// Сброс отображения боя
function resetBattleDisplay() {
    const playerDisplay = document.getElementById('player-choice-display');
    const opponentDisplay = document.getElementById('opponent-choice-display');
    
    playerDisplay.innerHTML = '';
    opponentDisplay.innerHTML = '';
    playerDisplay.style.background = 'rgba(255, 255, 255, 0.1)';
    opponentDisplay.style.background = 'rgba(255, 255, 255, 0.1)';
    
    document.querySelectorAll('.choice-btn').forEach(btn => {
        btn.classList.remove('active');
    });
}

// Сделать выбор
function makeChoice(choice) {
    if (!gameState.currentGame || gameState.currentGame.playerChoice) {
        return;
    }
    
    clearInterval(gameState.battleTimer);
    gameState.currentGame.playerChoice = choice;
    
    document.querySelectorAll('.choice-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.${choice}-btn`).classList.add('active');
    
    const choiceNames = {
        rock: 'Камень',
        paper: 'Бумага',
        scissors: 'Ножницы'
    };
    
    document.getElementById('battle-log').innerHTML = 
        `<div class="log-entry">Вы выбрали ${choiceNames[choice]}!</div>`;
    
    // Если PvP, отправляем ход на сервер
    if (gameState.isPvP && gameState.currentPvPGame && gameState.socket) {
        gameState.socket.emit('makePvPMove', {
            gameId: gameState.currentPvPGame.id,
            userId: gameState.user.id,
            choice: choice
        });
        
        document.getElementById('battle-log').innerHTML += 
            '<div class="log-entry">Ожидаем ход противника...</div>';
    } else {
        // Игра с ботом
        setTimeout(function() {
            botMakeChoice(choice);
        }, 1000);
    }
}

// Бот делает выбор
function botMakeChoice(playerChoice) {
    if (!gameState.currentGame) return;
    
    let opponentChoice;
    if (Math.random() < 0.6) {
        if (playerChoice === 'rock') opponentChoice = 'scissors';
        else if (playerChoice === 'paper') opponentChoice = 'rock';
        else opponentChoice = 'paper';
    } else {
        const choices = ['rock', 'paper', 'scissors'];
        opponentChoice = choices[Math.floor(Math.random() * choices.length)];
    }
    
    gameState.currentGame.opponentChoice = opponentChoice;
    
    const choiceNames = {
        rock: 'Камень',
        paper: 'Бумага',
        scissors: 'Ножницы'
    };
    
    document.getElementById('battle-log').innerHTML += 
        `<div class="log-entry">Противник выбрал ${choiceNames[opponentChoice]}!</div>`;
    
    setTimeout(function() {
        calculateAndShowResult(playerChoice, opponentChoice);
    }, 1000);
}

// Расчет и показ результата
function calculateAndShowResult(playerChoice, opponentChoice) {
    const results = {
        rock: { beats: 'scissors', loses: 'paper' },
        paper: { beats: 'rock', loses: 'scissors' },
        scissors: { beats: 'paper', loses: 'rock' }
    };
    
    let result;
    let resultTitle;
    let reward = 0;
    
    if (playerChoice === opponentChoice) {
        result = 'draw';
        resultTitle = 'НИЧЬЯ!';
        reward = gameState.isPvP ? CONFIG.REWARD_DRAW : CONFIG.REWARD_BOT_DRAW;
        gameState.streak = 0;
    } else if (results[playerChoice].beats === opponentChoice) {
        result = 'win';
        resultTitle = 'ПОБЕДА!';
        reward = gameState.isPvP ? CONFIG.REWARD_WIN : CONFIG.REWARD_BOT_WIN;
        gameState.wins++;
        gameState.streak++;
    } else {
        result = 'lose';
        resultTitle = 'ПОРАЖЕНИЕ';
        reward = 1;
        gameState.streak = 0;
        gameState.losses++;
    }
    
    gameState.battles++;
    gameState.diamonds += reward;
    
    // Обновляем статистику на сервере
    updateServerStats(result, reward);
    
    saveGameState();
    updateUI();
    
    showResultScreen(result, resultTitle, reward, playerChoice, opponentChoice);
}

// Обработка PvP результата
function processPvPResult(data) {
    const choiceNames = {
        rock: 'Камень',
        paper: 'Бумага',
        scissors: 'Ножницы'
    };
    
    let result;
    let resultTitle;
    let reward = 0;
    const isWinner = data.winner === gameState.user.id;
    const isDraw = data.isDraw;
    
    if (isDraw) {
        result = 'draw';
        resultTitle = 'НИЧЬЯ!';
        reward = CONFIG.REWARD_DRAW;
        gameState.streak = 0;
    } else if (isWinner) {
        result = 'win';
        resultTitle = 'ПОБЕДА!';
        reward = CONFIG.REWARD_WIN;
        gameState.wins++;
        gameState.streak++;
    } else {
        result = 'lose';
        resultTitle = 'ПОРАЖЕНИЕ';
        reward = 1;
        gameState.streak = 0;
        gameState.losses++;
    }
    
    gameState.battles++;
    gameState.diamonds += reward;
    
    updateServerStats(result, reward);
    saveGameState();
    updateUI();
    
    showResultScreen(result, resultTitle, reward, 
        choiceNames[data.player1Choice] || '?', 
        choiceNames[data.player2Choice] || '?');
}

// Обновление статистики на сервере
async function updateServerStats(result, goldChange) {
    if (!gameState.user || !gameState.user.id) return;
    
    try {
        const response = await fetch('/api/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: gameState.user.id,
                result: result,
                goldChange: goldChange
            })
        });
        
        if (!response.ok) {
            console.error('Ошибка обновления статистики на сервере');
        }
    } catch (error) {
        console.error('Ошибка отправки статистики:', error);
    }
}

// Показать экран результата
function showResultScreen(result, title, reward, playerChoice, opponentChoice) {
    document.getElementById('result-title').textContent = title;
    
    if (reward > 0) {
        document.getElementById('reward-amount').textContent = `+${reward}`;
        document.getElementById('reward-container').style.display = 'flex';
    } else {
        document.getElementById('reward-container').style.display = 'none';
    }
    
    showScreen('result');
    
    if (reward > 0) {
        showNotification(`+${reward} алмазов`);
    }
}

// Сыграть ещё раз
function playAgain() {
    gameState.currentGame = null;
    gameState.currentPvPGame = null;
    resetBattleDisplay();
    
    if (gameState.isPvP) {
        startPvPSearch();
    } else {
        startBattleWithBot();
    }
}

// Показать уведомление
function showNotification(text) {
    const notification = document.getElementById('notification');
    const textElement = document.getElementById('notification-text');
    
    if (notification && textElement) {
        textElement.textContent = text;
        notification.classList.remove('hidden');
        
        setTimeout(function() {
            notification.classList.add('hidden');
        }, 2000);
    }
}

// Экспорт функций для HTML
window.showScreen = showScreen;
window.startPvPSearch = startPvPSearch;
window.cancelSearch = cancelSearch;
window.makeChoice = makeChoice;
window.playAgain = playAgain;
window.copyReferralLink = copyReferralLink;
window.shareReferralLink = shareReferralLink;
