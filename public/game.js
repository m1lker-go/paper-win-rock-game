// Конфигурация игры
const CONFIG = {
    SEARCH_TIMEOUT: 15000, // 15 секунд на поиск
    BATTLE_TIMEOUT: 10000, // 10 секунд на выбор
    ANIMATION_DURATION: 2000, // 2 секунды анимации
    RESULT_DELAY: 3000, // 3 секунды до результата
    REWARD_WIN: 5, // Алмазов за победу
    REWARD_DRAW: 1 // Алмазов за ничью
};

// Пути к ресурсам - ИСПРАВЛЕНО!
const ASSETS = {
    ANIMATIONS: {
        LOADING: 'assets/animations/loading.gif',
        ROCK: 'assets/animations/rock-animation.gif',
        PAPER: 'assets/animations/paper-animation.gif',
        SCISSORS: 'assets/animations/scissors-animation.gif'
    },
    ICONS: {
        ROCK: 'assets/icons/rock.png',
        PAPER: 'assets/icons/paper.png',
        SCISSORS: 'assets/icons/scissors.png',
        GEM: 'assets/icons/gem.png',
        AVATAR: 'assets/icons/avatar.png'
    }
};

// Состояние игры
const gameState = {
    // Статистика
    diamonds: 0,
    wins: 0,
    losses: 0,
    streak: 0,
    battles: 0,
    
    // Настройки
    sound: true,
    darkTheme: true,
    
    // Текущая игра
    currentGame: null,
    searchTimer: null,
    battleTimer: null,
    round: 1,
    
    // Пользователь
    user: null
};

// Инициализация игры
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎮 Paper Win Rock загружается...');
    
    // Загружаем сохранённое состояние
    loadGameState();
    
    // Инициализируем Telegram Web App
    initTelegram();
    
    // Обновляем интерфейс
    updateUI();
    
    // Применяем отражение элементов
    applyReflection();
    
    // Имитируем загрузку
    setTimeout(function() {
        document.getElementById('loading-screen').classList.add('hidden');
        document.getElementById('main-menu').classList.remove('hidden');
        console.log('✅ Игра готова!');
        
        // Ещё раз применяем отражение после загрузки
        setTimeout(applyReflection, 100);
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
                    `<img src="${ASSETS.ICONS.AVATAR}" alt="${user.first_name || 'Игрок'}">`;
                document.getElementById('username').textContent = user.first_name || 'Игрок';
                
                gameState.user = user;
                console.log('🤖 Telegram пользователь:', user);
            }
        }
    } catch (error) {
        console.error('Ошибка инициализации Telegram:', error);
    }
}

// Функция для отражения элементов
function applyReflection() {
    console.log('🔄 Применяем отражение элементов...');
    
    // 1. Игрок - отражаем по горизонтали
    const playerElements = document.querySelectorAll('.player.you, .player-hand');
    playerElements.forEach(el => {
        el.style.transform = 'scaleX(-1)';
        console.log('✅ Отразили игрока:', el);
    });
    
    // 2. Противник - оставляем как есть
    const botElements = document.querySelectorAll('.player.opponent, .bot-hand');
    botElements.forEach(el => {
        el.style.transform = 'scaleX(1)';
    });
    
    // 3. Кнопки выбора - отражаем
    const choiceButtons = document.querySelectorAll('.choice-btn');
    choiceButtons.forEach(btn => {
        btn.style.transform = 'scaleX(-1)';
        
        // Текст внутри кнопки оставляем нормальным (отражаем обратно)
        const textElements = btn.querySelectorAll('.choice-name');
        textElements.forEach(textEl => {
            textEl.style.transform = 'scaleX(-1)';
            textEl.style.display = 'inline-block';
        });
        
        // Иконки внутри кнопок отражаем
        const icons = btn.querySelectorAll('.choice-icon');
        icons.forEach(icon => {
            icon.style.transform = 'scaleX(-1)';
        });
    });
    
    // 4. Превью в результатах
    const previews = document.querySelectorAll('.player-preview');
    previews.forEach(preview => {
        preview.style.transform = 'scaleX(-1)';
    });
    
    console.log('✅ Отражение применено!');
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
            gameState.sound = parsed.sound !== undefined ? parsed.sound : true;
            gameState.darkTheme = parsed.darkTheme !== undefined ? parsed.darkTheme : true;
            
            console.log('💾 Состояние загружено:', gameState);
        }
    } catch (error) {
        console.error('Ошибка загрузки состояния:', error);
    }
}

// Сохранение состояния
function saveGameState() {
    try {
        localStorage.setItem('paperWinRockState', JSON.stringify(gameState));
        console.log('💾 Состояние сохранено');
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
}

// Функции навигации
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
    
    // Останавливаем таймеры
    if (screenId !== 'battle' && gameState.battleTimer) {
        clearInterval(gameState.battleTimer);
        gameState.battleTimer = null;
    }
    
    if (screenId !== 'search' && gameState.searchTimer) {
        clearInterval(gameState.searchTimer);
        gameState.searchTimer = null;
    }
    
    // Применяем отражение для нового экрана
    setTimeout(applyReflection, 50);
}

// Начать поиск PvP
function startPvPSearch() {
    showScreen('search');
    
    // Сброс отображения
    resetBattleDisplay();
    document.getElementById('opponent-name').textContent = 'Поиск...';
    document.getElementById('battle-type').textContent = 'PvP БИТВА';
    
    // Запуск таймера поиска
    let searchTime = CONFIG.SEARCH_TIMEOUT / 1000;
    document.getElementById('search-timer').textContent = searchTime;
    
    gameState.searchTimer = setInterval(function() {
        searchTime--;
        document.getElementById('search-timer').textContent = searchTime;
        
        if (searchTime <= 0) {
            clearInterval(gameState.searchTimer);
            // Если не нашли игрока, сражаемся с ботом
            startBattleWithBot();
        }
    }, 1000);
    
    // Имитация поиска игрока (30% шанс найти)
    setTimeout(function() {
        if (Math.random() < 0.3) { // 30% шанс найти игрока
            clearInterval(gameState.searchTimer);
            startBattleWithPlayer();
        }
    }, Math.random() * 10000 + 3000); // Случайное время 3-13 секунд
}

// Отмена поиска
function cancelSearch() {
    if (gameState.searchTimer) {
        clearInterval(gameState.searchTimer);
        gameState.searchTimer = null;
    }
    showScreen('main-menu');
}

// Начать бой с игроком
function startBattleWithPlayer() {
    const opponentNames = [
        'Александр', 'Мария', 'Иван', 'Анна', 'Дмитрий', 
        'Екатерина', 'Сергей', 'Ольга', 'Андрей', 'Наталья'
    ];
    const opponentName = opponentNames[Math.floor(Math.random() * opponentNames.length)];
    
    document.getElementById('opponent-name').textContent = opponentName;
    document.getElementById('battle-type').textContent = 'PvP БИТВА';
    
    initBattle('pvp');
}

// Начать бой с ботом
function startBattleWithBot() {
    const botNames = ['🤖 Бот-Профи', '🤖 ИИ-Мастер', '🤖 Робот3000', '🤖 Алгоритм'];
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
        opponentChoice: null,
        round: gameState.round || 1,
        isPvP: mode === 'pvp'
    };
    
    // Обновление информации о раунде
    document.getElementById('round-counter').textContent = `Раунд ${gameState.currentGame.round}`;
    document.getElementById('battle-log').innerHTML = '<div class="log-entry">Выберите ваш ход!</div>';
    
    // Применяем отражение для боя
    applyReflection();
    
    // Запуск таймера боя
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
            // Если игрок не выбрал ход, выбираем случайный
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
    
    // Сброс активных кнопок
    document.querySelectorAll('.choice-btn').forEach(btn => {
        btn.classList.remove('active');
    });
}

// Сделать выбор
function makeChoice(choice) {
    if (!gameState.currentGame || gameState.currentGame.playerChoice) {
        return; // Уже выбрали
    }
    
    // Останавливаем таймер
    clearInterval(gameState.battleTimer);
    
    // Записываем выбор игрока
    gameState.currentGame.playerChoice = choice;
    
    // Подсвечиваем выбранную кнопку
    document.querySelectorAll('.choice-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.${choice}-btn`).classList.add('active');
    
    // Показываем PNG выбора игрока
    const playerDisplay = document.getElementById('player-choice-display');
    playerDisplay.innerHTML = '';
    playerDisplay.style.background = `url(${ASSETS.ICONS[choice.toUpperCase()]}) no-repeat center/contain`;
    playerDisplay.style.transform = 'scaleX(-1)'; // Отражаем руку игрока
    
    // Обновляем лог
    const choiceNames = {
        rock: 'Камень',
        paper: 'Бумага',
        scissors: 'Ножницы'
    };
    
    document.getElementById('battle-log').innerHTML = 
        `<div class="log-entry">Вы выбрали ${choiceNames[choice]}!</div>`;
    
    // Ждём и показываем выбор противника
    setTimeout(function() {
        determineOpponentChoice(choice);
    }, 1000);
}

// Определить выбор противника
function determineOpponentChoice(playerChoice) {
    let opponentChoice;
    
    if (gameState.currentGame.isPvP) {
        // PvP: случайный выбор
        const choices = ['rock', 'paper', 'scissors'];
        opponentChoice = choices[Math.floor(Math.random() * choices.length)];
    } else {
        // Бот: 60% шанс проиграть (для баланса)
        if (Math.random() < 0.6) {
            // Бот проигрывает
            if (playerChoice === 'rock') opponentChoice = 'scissors';
            else if (playerChoice === 'paper') opponentChoice = 'rock';
            else opponentChoice = 'paper';
        } else {
            // Бот выигрывает или ничья
            const choices = ['rock', 'paper', 'scissors'];
            opponentChoice = choices[Math.floor(Math.random() * choices.length)];
        }
    }
    
    gameState.currentGame.opponentChoice = opponentChoice;
    
    // Показываем PNG выбора противника
    const opponentDisplay = document.getElementById('opponent-choice-display');
    opponentDisplay.innerHTML = '';
    opponentDisplay.style.background = `url(${ASSETS.ICONS[opponentChoice.toUpperCase()]}) no-repeat center/contain`;
    opponentDisplay.style.transform = 'scaleX(1)'; // Рука бота не отражается
    
    // Обновляем лог
    const choiceNames = {
        rock: 'Камень',
        paper: 'Бумага',
        scissors: 'Ножницы'
    };
    
    document.getElementById('battle-log').innerHTML += 
        `<div class="log-entry">Противник выбрал ${choiceNames[opponentChoice]}!</div>`;
    
    // Ждём и запускаем анимацию боя
    setTimeout(function() {
        startFightAnimation(playerChoice, opponentChoice);
    }, 1000);
}

// Анимация боя - ИСПРАВЛЕНО!
function startFightAnimation(playerChoice, opponentChoice) {
    const playerDisplay = document.getElementById('player-choice-display');
    const opponentDisplay = document.getElementById('opponent-choice-display');
    
    console.log('🎬 Запускаем анимацию боя...');
    console.log('📂 Путь к анимациям:', ASSETS.ANIMATIONS);
    
    // Запускаем GIF анимации - ИСПРАВЛЕНЫ ПУТИ!
    playerDisplay.style.background = `url(${ASSETS.ANIMATIONS[playerChoice.toUpperCase()]}) no-repeat center/contain`;
    playerDisplay.style.transform = 'scaleX(-1)'; // Отражаем анимацию игрока
    
    opponentDisplay.style.background = `url(${ASSETS.ANIMATIONS[opponentChoice.toUpperCase()]}) no-repeat center/contain`;
    opponentDisplay.style.transform = 'scaleX(1)'; // Анимация бота не отражается
    
    // Добавляем анимацию пульсации
    playerDisplay.classList.add('fighting');
    opponentDisplay.classList.add('fighting');
    
    // Обновляем лог
    document.getElementById('battle-log').innerHTML += 
        '<div class="log-entry">СРАЖЕНИЕ!</div>';
    
    // Через 2 секунды возвращаем PNG и показываем результат
    setTimeout(function() {
        playerDisplay.style.background = `url(${ASSETS.ICONS[playerChoice.toUpperCase()]}) no-repeat center/contain`;
        playerDisplay.style.transform = 'scaleX(-1)';
        
        opponentDisplay.style.background = `url(${ASSETS.ICONS[opponentChoice.toUpperCase()]}) no-repeat center/contain`;
        opponentDisplay.style.transform = 'scaleX(1)';
        
        playerDisplay.classList.remove('fighting');
        opponentDisplay.classList.remove('fighting');
        
        // Ждём ещё 1 секунду и показываем результат
        setTimeout(function() {
            calculateAndShowResult(playerChoice, opponentChoice);
        }, 1000);
    }, CONFIG.ANIMATION_DURATION);
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
    let resultMessage;
    let reward = 0;
    
    if (playerChoice === opponentChoice) {
        result = 'draw';
        resultTitle = 'НИЧЬЯ!';
        resultMessage = 'Одинаковый выбор!';
        reward = CONFIG.REWARD_DRAW;
        
        // Ничья - сохраняем серию
    } else if (results[playerChoice].beats === opponentChoice) {
        result = 'win';
        resultTitle = 'ПОБЕДА!';
        resultMessage = 'Вы победили в бою!';
        reward = CONFIG.REWARD_WIN;
        
        // Обновляем статистику
        gameState.wins++;
        gameState.streak++;
        gameState.diamonds += reward;
    } else {
        result = 'lose';
        resultTitle = 'ПОРАЖЕНИЕ';
        resultMessage = 'Попробуйте ещё раз!';
        gameState.streak = 0;
    }
    
    // Обновляем общую статистику
    gameState.battles++;
    
    // Сохраняем состояние
    saveGameState();
    updateUI();
    
    // Показываем экран результата
    showResultScreen(result, resultTitle, resultMessage, reward, playerChoice, opponentChoice);
}

// Показать экран результата
function showResultScreen(result, title, message, reward, playerChoice, opponentChoice) {
    // Устанавливаем результат
    document.getElementById('result-title').textContent = title;
    document.getElementById('result-message').textContent = message;
    
    // Показываем награду
    const rewardContainer = document.getElementById('reward-container');
    if (reward > 0) {
        document.getElementById('reward-amount').textContent = `+${reward}`;
        rewardContainer.style.display = 'flex';
    } else {
        rewardContainer.style.display = 'none';
    }
    
    // Показываем превью выборов
    const playerPreview = document.getElementById('player-preview');
    const opponentPreview = document.getElementById('opponent-preview');
    
    playerPreview.style.background = `url(${ASSETS.ICONS[playerChoice.toUpperCase()]}) no-repeat center/contain`;
    playerPreview.style.transform = 'scaleX(-1)'; // Отражаем превью игрока
    
    opponentPreview.style.background = `url(${ASSETS.ICONS[opponentChoice.toUpperCase()]}) no-repeat center/contain`;
    opponentPreview.style.transform = 'scaleX(1)'; // Превью бота не отражается
    
    // Показываем экран
    showScreen('result');
    
    // Показываем уведомление о награде
    if (reward > 0) {
        showNotification(`+${reward} алмазов`);
    }
    
    // Если ничья - увеличиваем раунд
    if (result === 'draw') {
        gameState.round++;
    } else {
        gameState.round = 1;
    }
}

// Сыграть ещё раз
function playAgain() {
    if (gameState.currentGame && gameState.currentGame.mode === 'pvp') {
        // PvP: ищем нового противника
        startPvPSearch();
    } else {
        // Бот: начинаем новый бой
        startBattleWithBot();
    }
}

// Показать уведомление
function showNotification(text) {
    const notification = document.getElementById('notification');
    const textElement = document.getElementById('notification-text');
    
    textElement.textContent = text;
    notification.classList.remove('hidden');
    
    setTimeout(function() {
        notification.classList.add('hidden');
    }, 2000);
}

// Показать сообщение "скоро"
function showComingSoon() {
    showNotification('Скоро будет доступно!');
}

// Экспорт функций для HTML
window.showScreen = showScreen;
window.startPvPSearch = startPvPSearch;
window.cancelSearch = cancelSearch;
window.makeChoice = makeChoice;
window.playAgain = playAgain;
window.showComingSoon = showComingSoon;

