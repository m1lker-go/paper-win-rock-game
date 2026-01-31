// Глобальные переменные
let currentScreen = 'loading';
let userData = null;
let currentGame = null;
let gameTimer = null;
let battleAnimationInterval = null;
let waitingAnimationActive = true;
// Добавим в начало app.js после объявления переменных
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

// Обновим функцию startLoading
function startLoading() {
    const progressBar = document.querySelector('.progress');
    const loadingPercent = document.getElementById('loading-percent');
    
    if (progressBar && loadingPercent) {
        let width = 0;
        const interval = setInterval(() => {
            if (width >= 100) {
                clearInterval(interval);
                
                // Загружаем данные
                updateUserUI();
                loadSkins();
                loadTasks();
                
                // Показываем главное меню через 0.5 секунды
                setTimeout(() => {
                    showScreen('main-menu');
                }, 500);
                return;
            }
            width += 2;
            progressBar.style.width = width + '%';
            loadingPercent.textContent = width + '%';
        }, 20);
    }
}

// Обновим функцию updateUserUI для загрузки аватара
function updateUserUI() {
    if (!userData) return;
    
    // Обновить аватар
    const avatarImg = document.getElementById('avatar-img');
    if (avatarImg) {
        avatarImg.src = ASSETS.ICONS.AVATAR;
        avatarImg.alt = userData.firstName || userData.username;
    }
    
    // Остальной код остается прежним...
}

// Обновим функцию loadSkins для использования картинок
function getSkinImage(type, skinId = 'default') {
    // Для простоты используем эмодзи, но можно заменить на картинки
    const emojis = {
        default: { rock: '✊', paper: '✋', scissors: '✌️' },
        fire: { rock: '🔥', paper: '🔥', scissors: '🔥' },
        ice: { rock: '❄️', paper: '❄️', scissors: '❄️' },
        thunder: { rock: '⚡', paper: '⚡', scissors: '⚡' },
        gold: { rock: '🥇', paper: '🥇', scissors: '🥇' },
        diamond: { rock: '💎', paper: '💎', scissors: '💎' }
    };
    
    const skin = emojis[skinId] || emojis.default;
    return skin[type] || skin[type];
}

// Дни недели для ежедневных заданий
const daysOfWeek = ['воскресенье', 'понедельник', 'вторник', 'среду', 'четверг', 'пятницу', 'субботу'];

// Пути к ресурсам (АНИМАЦИИ И КАРТИНКИ)
const ASSETS = {
    ANIMATIONS: {
        LOADING: 'assets/animations/loading.gif',
        ROCK: 'assets/animations/rock-animation.gif',
        PAPER: 'assets/animations/paper-animation.gif',
        SCISSORS: 'assets/animations/scissors-animation.gif',
        FIGHT: 'assets/animations/fight-animation.gif'
    },
    ICONS: {
        ROCK: 'assets/icons/rock.png',
        PAPER: 'assets/icons/paper.png',
        SCISSORS: 'assets/icons/scissors.png',
        GEM: 'assets/icons/gem.png',
        AVATAR: 'assets/icons/avatar.png'
    }
};

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    console.log('Игра загружается...');
    
    // Проверяем Telegram Web App
    if (window.Telegram?.WebApp) {
        Telegram.WebApp.ready();
        Telegram.WebApp.expand();
        Telegram.WebApp.setHeaderColor('#2d3436');
        Telegram.WebApp.setBackgroundColor('#1a1a2e');
        
        const initData = Telegram.WebApp.initDataUnsafe;
        if (initData?.user) {
            userData = {
                id: initData.user.id.toString(),
                username: initData.user.username || `Игрок_${initData.user.id.toString().slice(-4)}`,
                firstName: initData.user.first_name || 'Игрок',
                lastName: initData.user.last_name || '',
                isPremium: initData.user.is_premium || false,
                languageCode: initData.user.language_code || 'ru'
            };
            console.log('Telegram пользователь:', userData);
        }
    }
    
    // Если не в Telegram, создаем тестового пользователя
    if (!userData) {
        userData = {
            id: 'test_' + Date.now(),
            username: 'ТестовыйИгрок',
            firstName: 'Игрок',
            isPremium: false
        };
        console.log('Тестовый пользователь:', userData);
    }
    
    // Инициализируем данные пользователя
    initUserData();
    
    // Запускаем загрузку
    startLoading();
    
    // Устанавливаем дату последнего входа
    updateLastLogin();
    
    // Обновляем ежедневные задания если нужно
    updateDailyTasks();
});

// Инициализация данных пользователя
function initUserData() {
    const savedData = localStorage.getItem(`pwr_user_${userData.id}`);
    
    if (savedData) {
        const parsed = JSON.parse(savedData);
        userData = { ...userData, ...parsed };
        
        // Проверяем, не был ли это вчерашний день
        const lastLogin = new Date(parsed.lastLogin || 0);
        const today = new Date();
        const isNewDay = lastLogin.getDate() !== today.getDate() || 
                        lastLogin.getMonth() !== today.getMonth() || 
                        lastLogin.getFullYear() !== today.getFullYear();
        
        if (isNewDay) {
            // Сброс ежедневных заданий
            resetDailyTasks();
        }
    } else {
        // Новый пользователь
        userData = {
            ...userData,
            diamonds: 100,
            wins: 0,
            losses: 0,
            draws: 0,
            totalGames: 0,
            skinRock: 'default',
            skinPaper: 'default',
            skinScissors: 'default',
            ownedSkins: ['default'],
            referalCode: generateReferalCode(),
            referals: [],
            referalsCompleted: [],
            dailyTasks: {},
            completedTasks: [],
            lastLogin: new Date().toISOString(),
            streakDays: 1,
            lastStreakDate: new Date().toISOString(),
            inventory: {},
            stats: {
                winStreak: 0,
                bestWinStreak: 0,
                favoriteChoice: null,
                mostWinsAgainst: null
            }
        };
    }
}

// Генерация реферального кода
function generateReferalCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Обновление даты последнего входа
function updateLastLogin() {
    const now = new Date();
    userData.lastLogin = now.toISOString();
    
    // Проверка на стрик дней
    const lastDate = new Date(userData.lastStreakDate || 0);
    const isConsecutiveDay = (
        now.getDate() === lastDate.getDate() + 1 &&
        now.getMonth() === lastDate.getMonth() &&
        now.getFullYear() === lastDate.getFullYear()
    ) || (
        // Если вчера был последний день месяца
        now.getDate() === 1 &&
        lastDate.getDate() === new Date(lastDate.getFullYear(), lastDate.getMonth() + 1, 0).getDate()
    );
    
    if (isConsecutiveDay) {
        userData.streakDays++;
    } else if (now.getDate() !== lastDate.getDate() || now.getMonth() !== lastDate.getMonth()) {
        userData.streakDays = 1;
    }
    
    userData.lastStreakDate = now.toISOString();
    saveUserData();
}

// Сохранение данных пользователя
function saveUserData() {
    localStorage.setItem(`pwr_user_${userData.id}`, JSON.stringify(userData));
}

// Загрузка игры
function startLoading() {
    const progressBar = document.querySelector('.progress');
    if (progressBar) {
        let width = 0;
        const interval = setInterval(() => {
            if (width >= 100) {
                clearInterval(interval);
                
                // Загружаем данные
                updateUserUI();
                loadSkins();
                loadTasks();
                
                // Показываем главное меню через 0.5 секунды
                setTimeout(() => {
                    showScreen('main-menu');
                }, 500);
                return;
            }
            width += 2;
            progressBar.style.width = width + '%';
        }, 20);
    }
}

// Показать экран
function showScreen(screenId) {
    // Скрыть все экраны
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Показать нужный экран
    const targetScreen = document.getElementById(`${screenId}-screen`);
    if (targetScreen) {
        targetScreen.classList.add('active');
        currentScreen = screenId;
        
        // Очистить анимации боя если перешли в другой экран
        if (screenId !== 'battle') {
            stopWaitingAnimation();
        }
    }
    
    // Специальные действия для экранов
    switch (screenId) {
        case 'main-menu':
            updateUserUI();
            break;
        case 'battle':
            startWaitingAnimation();
            startBattleTimer();
            break;
        case 'difficulty':
            loadDifficultyOptions();
            break;
        case 'shop':
            loadShopItems();
            break;
        case 'backpack':
            loadCollection();
            break;
        case 'tasks':
            loadTasks();
            break;
        case 'settings':
            loadSettings();
            break;
    }
}

// Обновить UI пользователя
function updateUserUI() {
    if (!userData) return;
    
    // Обновить имя
    const usernameElements = document.querySelectorAll('#username');
    usernameElements.forEach(el => {
        el.textContent = userData.firstName || userData.username;
    });
    
    // Обновить алмазы
    const diamondElements = document.querySelectorAll('#diamond-count, #shop-balance');
    diamondElements.forEach(el => {
        el.textContent = userData.diamonds || 0;
    });
    
    // Обновить статистику
    updateStats();
    
    // Обновить реферальную информацию
    updateReferalInfo();
}

// Обновить статистику
function updateStats() {
    if (!userData) return;
    
    const statWins = document.getElementById('stat-wins');
    const statLosses = document.getElementById('stat-losses');
    const statStreak = document.getElementById('stat-streak');
    const totalWins = document.getElementById('total-wins');
    const totalLosses = document.getElementById('total-losses');
    
    if (statWins) statWins.textContent = userData.wins || 0;
    if (statLosses) statLosses.textContent = userData.losses || 0;
    if (statStreak) statStreak.textContent = userData.stats?.winStreak || 0;
    if (totalWins) totalWins.textContent = userData.wins || 0;
    if (totalLosses) totalLosses.textContent = userData.losses || 0;
}

// Загрузка опций сложности
function loadDifficultyOptions() {
    const difficulties = [
        { id: 'easy', name: 'НОВИЧОК', emoji: '😊', reward: 3, desc: 'Идеально для начала' },
        { id: 'medium', name: 'ОПЫТНЫЙ', emoji: '😎', reward: 5, desc: 'Сбалансированная игра' },
        { id: 'hard', name: 'ЭКСПЕРТ', emoji: '🤖', reward: 10, desc: 'Для настоящих чемпионов' }
    ];
    
    const container = document.querySelector('.difficulty-options');
    if (container) {
        container.innerHTML = difficulties.map(diff => `
            <button class="difficulty-btn ${diff.id}" onclick="startBotGame('${diff.id}')">
                <div class="difficulty-icon">${diff.emoji}</div>
                <div class="difficulty-info">
                    <h3>${diff.name}</h3>
                    <p>${diff.desc}</p>
                    <div class="reward-info">Награда: +${diff.reward} алмазов</div>
                </div>
            </button>
        `).join('');
    }
}

// Начать игру с ботом
function startBotGame(difficulty) {
    selectedDifficulty = difficulty;
    
    // Создаем бота
    const botTypes = {
        easy: ['Новичок Бот', 'Ученик', 'Начинающий'],
        medium: ['Опытный Бот', 'Ветеран', 'Мастер'],
        hard: ['Легендарный Бот', 'Чемпион', 'Гроссмейстер']
    };
    
    const names = botTypes[difficulty];
    const botName = names[Math.floor(Math.random() * names.length)];
    
    currentGame = {
        id: Date.now(),
        player1: userData.id,
        player2: `bot_${Date.now()}`,
        bot: {
            name: botName,
            difficulty: difficulty,
            avatar: '🤖'
        },
        status: 'waiting',
        playerChoice: null,
        botChoice: null,
        result: null,
        startedAt: Date.now()
    };
    
    // Обновляем UI для боя
    document.getElementById('battle-mode').textContent = 'БОЙ С БОТОМ';
    document.getElementById('player2-name').textContent = botName;
    document.getElementById('player2-avatar').textContent = '🤖';
    document.getElementById('player2-difficulty').textContent = 
        difficulty === 'easy' ? 'Новичок' : 
        difficulty === 'medium' ? 'Средний' : 'Эксперт';
    
    // Сбрасываем выбор
    resetChoices();
    
    // Очищаем лог
    const log = document.getElementById('battle-log');
    if (log) {
        log.innerHTML = '<div class="log-entry">Начинаем бой с ботом! Сделайте ваш ход.</div>';
    }
    
    // Показываем экран боя
    showScreen('battle');
}

// Начать анимацию ожидания
function startWaitingAnimation() {
    if (battleAnimationInterval) return;
    
    waitingAnimationActive = true;
    
    const player1Animation = document.getElementById('player1-animation');
    const player2Animation = document.getElementById('player2-animation');
    
    if (player1Animation && player2Animation) {
        player1Animation.style.display = 'block';
        player2Animation.style.display = 'block';
    }
    
    // Скрываем выбор игроков
    const player1Choice = document.getElementById('player1-choice');
    const player2Choice = document.getElementById('player2-choice');
    
    if (player1Choice) player1Choice.style.display = 'none';
    if (player2Choice) player2Choice.style.display = 'none';
    
    // Анимация тряски
    battleAnimationInterval = setInterval(() => {
        if (!waitingAnimationActive) return;
        
        // Можно добавить класс с анимацией, если нужна CSS-анимация
        if (player1Animation) {
            player1Animation.style.transform = `scaleX(-1) translateX(${Math.random() * 4 - 2}px) translateY(${Math.random() * 4 - 2}px)`;
        }
        if (player2Animation) {
            player2Animation.style.transform = `translateX(${Math.random() * 4 - 2}px) translateY(${Math.random() * 4 - 2}px)`;
        }
    }, 50);
}

// Остановить анимацию ожидания
function stopWaitingAnimation() {
    waitingAnimationActive = false;
    
    if (battleAnimationInterval) {
        clearInterval(battleAnimationInterval);
        battleAnimationInterval = null;
    }
    
    const player1Animation = document.getElementById('player1-animation');
    const player2Animation = document.getElementById('player2-animation');
    
    if (player1Animation) player1Animation.style.display = 'none';
    if (player2Animation) player2Animation.style.display = 'none';
}

// Сделать выбор
function makeChoice(choice) {
    if (!currentGame || !waitingAnimationActive) return;
    
    // Останавливаем анимацию ожидания
    stopWaitingAnimation();
    
    // Обновляем выбор игрока
    currentGame.playerChoice = choice;
    
    const player1Choice = document.getElementById('player1-choice');
    if (player1Choice) {
        player1Choice.innerHTML = ''; // Очищаем содержимое
        player1Choice.style.background = `url(${ASSETS.ICONS[choice.toUpperCase()]}) no-repeat center/contain`;
        player1Choice.style.transform = 'scaleX(-1)'; // Отражаем выбор игрока
        player1Choice.style.display = 'block';
        player1Choice.style.width = '80px';
        player1Choice.style.height = '80px';
    }
    
    // Добавляем в лог
    addLogEntry(`Вы выбрали: ${getChoiceName(choice)}`);
    
    // Бот делает выбор через случайную задержку
    const delay = 500 + Math.random() * 1500; // От 0.5 до 2 секунд
    setTimeout(() => {
        botMakeChoice(choice);
    }, delay);
}

// Бот делает выбор
function botMakeChoice(playerChoice) {
    if (!currentGame) return;
    
    const difficulty = currentGame.bot.difficulty;
    let botChoice;
    
    // Логика бота в зависимости от сложности
    const choices = ['rock', 'paper', 'scissors'];
    const random = Math.random();
    
    if (difficulty === 'easy') {
        // Простой бот - случайный выбор
        botChoice = choices[Math.floor(Math.random() * 3)];
    } else if (difficulty === 'medium') {
        // Средний бот - иногда выбирает выигрышный ход
        if (random < 0.4) {
            const winningMoves = { rock: 'paper', paper: 'scissors', scissors: 'rock' };
            botChoice = winningMoves[playerChoice];
        } else {
            botChoice = choices[Math.floor(Math.random() * 3)];
        }
    } else {
        // Сложный бот - часто выбирает выигрышный ход
        if (random < 0.7) {
            const winningMoves = { rock: 'paper', paper: 'scissors', scissors: 'rock' };
            botChoice = winningMoves[playerChoice];
        } else {
            botChoice = choices[Math.floor(Math.random() * 3)];
        }
    }
    
    currentGame.botChoice = botChoice;
    
    // Обновляем выбор бота
    const player2Choice = document.getElementById('player2-choice');
    if (player2Choice) {
        player2Choice.innerHTML = ''; // Очищаем содержимое
        player2Choice.style.background = `url(${ASSETS.ICONS[botChoice.toUpperCase()]}) no-repeat center/contain`;
        player2Choice.style.transform = 'scaleX(1)'; // Без отражения для бота
        player2Choice.style.display = 'block';
        player2Choice.style.width = '80px';
        player2Choice.style.height = '80px';
    }
    
    addLogEntry(`Бот выбрал: ${getChoiceName(botChoice)}`);
    // Анимация боя
function startFightAnimation(playerChoice, botChoice) {
    const player1Choice = document.getElementById('player1-choice');
    const player2Choice = document.getElementById('player2-choice');
    
    if (player1Choice && player2Choice) {
        console.log('🎬 Запускаем анимацию боя...');
        
        // Используем fight-animation.gif для обоих игроков
        const fightAnimation = ASSETS.ANIMATIONS.FIGHT;
        
        // Для игрока - отражаем по горизонтали
        player1Choice.style.background = `url(${fightAnimation}) no-repeat center/contain`;
        player1Choice.style.transform = 'scaleX(-1)'; // Отражаем анимацию игрока
        
        // Для бота - не отражаем
        player2Choice.style.background = `url(${fightAnimation}) no-repeat center/contain`;
        player2Choice.style.transform = 'scaleX(1)'; // Без отражения
        
        // Добавляем класс для анимации (если нужно)
        player1Choice.classList.add('fighting');
        player2Choice.classList.add('fighting');
        
        addLogEntry('СРАЖЕНИЕ!');
        
        // Через 2 секунды возвращаем PNG и определяем победителя
        setTimeout(() => {
            // Возвращаем PNG иконки
            player1Choice.style.background = `url(${ASSETS.ICONS[playerChoice.toUpperCase()]}) no-repeat center/contain`;
            player1Choice.style.transform = 'scaleX(-1)'; // PNG тоже отражаем
            
            player2Choice.style.background = `url(${ASSETS.ICONS[botChoice.toUpperCase()]}) no-repeat center/contain`;
            player2Choice.style.transform = 'scaleX(1)'; // PNG без отражения
            
            // Убираем класс анимации
            player1Choice.classList.remove('fighting');
            player2Choice.classList.remove('fighting');
            
            // Определяем победителя через 1 секунду
           // Запускаем анимацию боя
startFightAnimation(playerChoice, botChoice);
        }, 2000);
    }
}
    // Запускаем анимацию боя через 1 секунду
    setTimeout(() => {
        startFightAnimation(playerChoice, botChoice);
    }, 1000);
}

// Определить победителя
function determineWinner(playerChoice, botChoice) {
    if (!currentGame) return;
    
    let result;
    let message;
    let reward = 0;
    
    if (playerChoice === botChoice) {
        result = 'draw';
        message = 'Ничья!';
        reward = 1;
        userData.draws = (userData.draws || 0) + 1;
    } else {
        const rules = {
            rock: 'scissors',
            scissors: 'paper',
            paper: 'rock'
        };
        
        if (rules[playerChoice] === botChoice) {
            result = 'win';
            message = 'ПОБЕДА!';
            reward = selectedDifficulty === 'easy' ? 3 : 
                     selectedDifficulty === 'medium' ? 5 : 10;
            userData.wins = (userData.wins || 0) + 1;
            userData.stats.winStreak = (userData.stats.winStreak || 0) + 1;
            
            if (userData.stats.winStreak > (userData.stats.bestWinStreak || 0)) {
                userData.stats.bestWinStreak = userData.stats.winStreak;
            }
        } else {
            result = 'lose';
            message = 'ПОРАЖЕНИЕ';
            reward = 1;
            userData.losses = (userData.losses || 0) + 1;
            userData.stats.winStreak = 0;
        }
    }
    
    userData.totalGames = (userData.totalGames || 0) + 1;
    userData.diamonds = (userData.diamonds || 0) + reward;
    
    // Сохраняем любимый выбор
    if (!userData.stats.favoriteChoice) {
        userData.stats.favoriteChoice = playerChoice;
    }
    
    // Обновляем статистику
    currentGame.result = result;
    currentGame.status = 'finished';
    
    // Обновляем UI результата
    updateResultScreen(result, playerChoice, botChoice, reward, message);
    
    // Сохраняем данные
    saveUserData();
    updateUserUI();
    
    // Показываем экран результата через 2 секунды
    setTimeout(() => {
        showScreen('result');
        stopBattleTimer();
    }, 2000);
}

// Обновить экран результата
function updateResultScreen(result, playerChoice, botChoice, reward, message) {
    const resultTitle = document.getElementById('result-title');
    const resultIcon = document.getElementById('result-icon');
    const resultMessage = document.getElementById('result-message');
    const rewardAmount = document.getElementById('reward-amount');
    
    if (resultTitle) resultTitle.textContent = message;
    
    let icon = '';
    switch (result) {
        case 'win': icon = '🏆'; break;
        case 'lose': icon = '💔'; break;
        case 'draw': icon = '🤝'; break;
    }
    
    if (resultIcon) resultIcon.textContent = icon;
    if (resultMessage) resultMessage.textContent = getResultMessage(result);
    if (rewardAmount) rewardAmount.textContent = `+${reward} алмазов`;
    
    // Обновляем превью выборов с отражением для игрока
    const yourPreview = document.getElementById('player-preview');
    const enemyPreview = document.getElementById('opponent-preview');
    
    if (yourPreview) {
        yourPreview.innerHTML = '';
        yourPreview.style.background = `url(${ASSETS.ICONS[playerChoice.toUpperCase()]}) no-repeat center/contain`;
        yourPreview.style.transform = 'scaleX(-1)'; // Отражаем превью игрока
        yourPreview.style.width = '60px';
        yourPreview.style.height = '60px';
    }
    
    if (enemyPreview) {
        enemyPreview.innerHTML = '';
        enemyPreview.style.background = `url(${ASSETS.ICONS[botChoice.toUpperCase()]}) no-repeat center/contain`;
        enemyPreview.style.transform = 'scaleX(1)'; // Превью бота без отражения
        enemyPreview.style.width = '60px';
        enemyPreview.style.height = '60px';
    }
}

// Получить сообщение результата
function getResultMessage(result) {
    const messages = {
        win: [
            'Отличная победа!',
            'Вы мастер этой игры!',
            'Превосходная стратегия!',
            'Бот не ожидал такого хода!'
        ],
        lose: [
            'В следующий раз повезёт!',
            'Бот сегодня в ударе!',
            'Попробуйте другую стратегию!',
            'Удача на вашей стороне в следующей игре!'
        ],
        draw: [
            'Равные соперники!',
            'Интересная ничья!',
            'Оба мыслили одинаково!',
            'Сыграйте ещё раз!'
        ]
    };
    
    const list = messages[result] || ['Игра завершена!'];
    return list[Math.floor(Math.random() * list.length)];
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

function getSkinEmoji(type, skinId = 'default') {
    const skins = {
        default: { rock: '✊', paper: '✋', scissors: '✌️' },
        fire: { rock: '🔥', paper: '🔥', scissors: '🔥' },
        ice: { rock: '❄️', paper: '❄️', scissors: '❄️' },
        thunder: { rock: '⚡', paper: '⚡', scissors: '⚡' }
    };
    
    return skins[skinId]?.[type] || skins.default[type];
}

// Сбросить выбор
function resetChoices() {
    const player1Choice = document.getElementById('player1-choice');
    const player2Choice = document.getElementById('player2-choice');
    
    if (player1Choice) {
        player1Choice.innerHTML = '';
        player1Choice.style.background = 'none';
        player1Choice.style.display = 'none';
        player1Choice.classList.remove('fighting');
    }
    if (player2Choice) {
        player2Choice.innerHTML = '';
        player2Choice.style.background = 'none';
        player2Choice.style.display = 'none';
        player2Choice.classList.remove('fighting');
    }
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
            
            // Автоматический выбор при тайм-ауте
            if (waitingAnimationActive) {
                const choices = ['rock', 'paper', 'scissors'];
                const autoChoice = choices[Math.floor(Math.random() * 3)];
                makeChoice(autoChoice);
                addLogEntry('Время вышло! Сделан случайный выбор.');
            }
        }
    }, 1000);
}

function stopBattleTimer() {
    if (gameTimer) {
        clearInterval(gameTimer);
        gameTimer = null;
    }
}

// Лог боя
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
    
    // Симуляция поиска 3 секунды
    setTimeout(() => {
        clearInterval(searchTimer);
        showNotification('Противник найден! Переходим к бою...');
        setTimeout(() => startBotGame('medium'), 1000);
    }, 3000);
}

function cancelSearch() {
    showScreen('main-menu');
}

// Загрузка скинов
function loadSkins() {
    // Обновляем текущие скины
    updateCurrentSkins();
}

function updateCurrentSkins() {
    if (!userData) return;
    
    const rockSkin = document.getElementById('current-rock');
    const paperSkin = document.getElementById('current-paper');
    const scissorsSkin = document.getElementById('current-scissors');
    
    if (rockSkin) rockSkin.textContent = getSkinEmoji('rock', userData.skinRock);
    if (paperSkin) paperSkin.textContent = getSkinEmoji('paper', userData.skinPaper);
    if (scissorsSkin) scissorsSkin.textContent = getSkinEmoji('scissors', userData.skinScissors);
    
    // Обновляем выбор в бою
    const rockChoice = document.getElementById('rock-skin');
    const paperChoice = document.getElementById('paper-skin');
    const scissorsChoice = document.getElementById('scissors-skin');
    
    if (rockChoice) rockChoice.textContent = getSkinEmoji('rock', userData.skinRock);
    if (paperChoice) paperChoice.textContent = getSkinEmoji('paper', userData.skinPaper);
    if (scissorsChoice) scissorsChoice.textContent = getSkinEmoji('scissors', userData.skinScissors);
}

// Магазин
function loadShopItems() {
    const skins = [
        { id: 'default', name: 'Обычный', price: 0, type: 'all', emoji: '🎮' },
        { id: 'fire', name: 'Огненный', price: 100, type: 'all', emoji: '🔥' },
        { id: 'ice', name: 'Ледяной', price: 100, type: 'all', emoji: '❄️' },
        { id: 'thunder', name: 'Громовой', price: 100, type: 'all', emoji: '⚡' },
        { id: 'gold', name: 'Золотой', price: 500, type: 'all', emoji: '🥇' },
        { id: 'diamond', name: 'Алмазный', price: 1000, type: 'all', emoji: '💎' }
    ];
    
    const container = document.getElementById('shop-items');
    if (!container) return;
    
    container.innerHTML = skins.map(skin => {
        const isOwned = userData.ownedSkins?.includes(skin.id) || skin.price === 0;
        const isEquipped = 
            userData.skinRock === skin.id || 
            userData.skinPaper === skin.id || 
            userData.skinScissors === skin.id;
        
        return `
            <div class="shop-item ${isOwned ? 'owned' : ''} ${isEquipped ? 'equipped' : ''}">
                <div class="shop-item-icon">${skin.emoji}</div>
                <div class="shop-item-name">${skin.name}</div>
                <div class="shop-item-price">
                    <i class="fas fa-gem"></i> ${skin.price}
                </div>
                ${isOwned ? 
                    `<button class="equip-btn" onclick="equipSkin('${skin.id}')" ${isEquipped ? 'disabled' : ''}>
                        ${isEquipped ? 'Надето' : 'Надеть'}
                    </button>` :
                    `<button class="buy-btn" onclick="buySkin('${skin.id}', ${skin.price})" ${(userData.diamonds || 0) < skin.price ? 'disabled' : ''}>
                        Купить
                    </button>`
                }
            </div>
        `;
    }).join('');
}

function buySkin(skinId, price) {
    if ((userData.diamonds || 0) < price) {
        showNotification('Недостаточно алмазов!');
        return;
    }
    
    userData.diamonds -= price;
    if (!userData.ownedSkins) userData.ownedSkins = [];
    if (!userData.ownedSkins.includes(skinId)) {
        userData.ownedSkins.push(skinId);
    }
    
    // Автонадевание при покупке
    equipSkin(skinId);
    
    saveUserData();
    updateUserUI();
    loadShopItems();
    updateCurrentSkins();
    
    showNotification(`Скин "${skinId}" куплен! -${price} алмазов`);
}

function equipSkin(skinId) {
    userData.skinRock = skinId;
    userData.skinPaper = skinId;
    userData.skinScissors = skinId;
    
    saveUserData();
    updateCurrentSkins();
    loadShopItems();
    
    showNotification('Скин надет на все варианты!');
}

// Коллекция
function loadCollection() {
    updateCurrentSkins();
    
    const skins = [
        { id: 'default', name: 'Обычный', type: 'all', emoji: '🎮' },
        { id: 'fire', name: 'Огненный', type: 'all', emoji: '🔥' },
        { id: 'ice', name: 'Ледяной', type: 'all', emoji: '❄️' }
    ];
    
    const container = document.getElementById('collection-items');
    if (!container) return;
    
    const ownedSkins = skins.filter(skin => userData.ownedSkins?.includes(skin.id));
    
    container.innerHTML = ownedSkins.map(skin => {
        const isEquipped = userData.skinRock === skin.id;
        
        return `
            <div class="collection-item ${isEquipped ? 'equipped' : ''}">
                <div class="collection-icon">${skin.emoji}</div>
                <div class="collection-name">${skin.name}</div>
                <button class="equip-btn-small" onclick="equipSkin('${skin.id}')" ${isEquipped ? 'disabled' : ''}>
                    ${isEquipped ? 'Надето' : 'Надеть'}
                </button>
            </div>
        `;
    }).join('');
}

// Обновление ежедневных заданий
function updateDailyTasks() {
    const now = new Date();
    const lastUpdate = new Date(userData.dailyTasks?.lastUpdate || 0);
    const mskOffset = 3 * 60 * 60 * 1000; // MSK is UTC+3
    const nowInMSK = new Date(now.getTime() + mskOffset);
    
    // Проверяем, наступил ли новый день по московскому времени
    const isNewDay = nowInMSK.getDate() !== lastUpdate.getDate() || 
                    nowInMSK.getMonth() !== lastUpdate.getMonth() || 
                    nowInMSK.getFullYear() !== lastUpdate.getFullYear();
    
    if (isNewDay) {
        resetDailyTasks();
    }
}

function resetDailyTasks() {
    const dailyTasks = [
        { id: 'daily_win_3', name: 'Выиграть 3 игры', reward: 50, progress: 0, target: 3, type: 'wins', completed: false },
        { id: 'daily_play_5', name: 'Сыграть 5 игр', reward: 30, progress: 0, target: 5, type: 'plays', completed: false },
        { id: 'daily_streak_2', name: 'Победная серия 2', reward: 40, progress: 0, target: 2, type: 'streak', completed: false },
        { id: 'daily_login', name: 'Зайти в игру', reward: 20, progress: 1, target: 1, type: 'login', completed: true }
    ];
    
    userData.dailyTasks = {
        tasks: dailyTasks,
        lastUpdate: new Date().toISOString()
    };
    
    // Отмечаем задание "Зайти в игру" как выполненное сразу
    const loginTask = dailyTasks.find(t => t.id === 'daily_login');
    if (loginTask) {
        loginTask.completed = true;
        userData.diamonds = (userData.diamonds || 0) + loginTask.reward;
        showNotification(`Ежедневная награда: +${loginTask.reward} алмазов за вход!`);
    }
    
    saveUserData();
    updateUserUI();
}

// Загрузка заданий
function loadTasks() {
    if (!userData.dailyTasks || !userData.dailyTasks.tasks) {
        resetDailyTasks();
    }
    
    const tasks = userData.dailyTasks.tasks || [];
    const completedTasks = userData.completedTasks || [];
    
    // Фильтруем невыполненные задания
    const activeTasks = tasks.filter(task => !task.completed && !completedTasks.includes(task.id));
    
    const container = document.getElementById('daily-tasks');
    if (container) {
        if (activeTasks.length === 0) {
            container.innerHTML = `
                <div class="task-item">
                    <div class="task-header">
                        <div class="task-title">
                            <i class="fas fa-check-circle"></i>
                            <span>Все задания выполнены!</span>
                        </div>
                    </div>
                    <div class="task-message">
                        Новые задания появятся завтра в 00:00 по МСК
                    </div>
                </div>
            `;
        } else {
            container.innerHTML = activeTasks.map(task => `
                <div class="task-item">
                    <div class="task-header">
                        <div class="task-title">
                            <i class="fas fa-star"></i>
                            <span>${task.name}</span>
                        </div>
                        <div class="task-reward">
                            <i class="fas fa-gem"></i>
                            <span>${task.reward}</span>
                        </div>
                    </div>
                    <div class="task-progress">
                        <div class="progress-text">
                            <span>${task.progress}/${task.target}</span>
                            <span>${Math.round((task.progress / task.target) * 100)}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${(task.progress / task.target) * 100}%"></div>
                        </div>
                    </div>
                    <button class="claim-btn" onclick="claimTask('${task.id}')" ${task.progress >= task.target ? '' : 'disabled'}>
                        ${task.progress >= task.target ? 'Получить награду' : 'Не выполнено'}
                    </button>
                </div>
            `).join('');
        }
    }
    
    // Обновляем прогресс заданий
    updateTaskProgress();
}

function updateTaskProgress() {
    if (!userData.dailyTasks?.tasks) return;
    
    const tasks = userData.dailyTasks.tasks;
    let updated = false;
    
    tasks.forEach(task => {
        if (task.completed) return;
        
        switch (task.type) {
            case 'wins':
                task.progress = Math.min(task.target, userData.wins || 0);
                break;
            case 'plays':
                task.progress = Math.min(task.target, userData.totalGames || 0);
                break;
            case 'streak':
                task.progress = Math.min(task.target, userData.stats?.winStreak || 0);
                break;
        }
        
        if (task.progress >= task.target && !task.completed) {
            updated = true;
        }
    });
    
    if (updated) {
        saveUserData();
        loadTasks();
    }
}

function claimTask(taskId) {
    const task = userData.dailyTasks.tasks.find(t => t.id === taskId);
    if (!task || task.completed) return;
    
    if (task.progress >= task.target) {
        task.completed = true;
        if (!userData.completedTasks) userData.completedTasks = [];
        userData.completedTasks.push(taskId);
        userData.diamonds = (userData.diamonds || 0) + task.reward;
        
        saveUserData();
        updateUserUI();
        loadTasks();
        
        showNotification(`Задание выполнено! +${task.reward} алмазов`);
    }
}

// Реферальная система
function updateReferalInfo() {
    const referalCount = document.getElementById('referal-count');
    const referalLink = document.getElementById('referal-url');
    
    if (referalCount) {
        referalCount.textContent = userData.referals?.length || 0;
    }
    
    if (referalLink) {
        // Ссылка на бота с реферальным кодом
        referalLink.value = `https://t.me/PaperWinRock_bot?start=${userData.referalCode}`;
    }
    
    // Статистика рефералов
    const referalEarned = document.getElementById('referal-earned');
    if (referalEarned) {
        referalEarned.textContent = (userData.referals?.length || 0) * 50;
    }
}

function copyReferalLink() {
    const input = document.getElementById('referal-url');
    if (input) {
        input.select();
        document.execCommand('copy');
        showNotification('Реферальная ссылка скопирована!');
    }
}

function shareReferalLink() {
    const url = `https://t.me/PaperWinRock_bot?start=${userData.referalCode}`;
    const text = `🎮 Присоединяйся к Paper Win Rock!\n\nИграй в крутую игру "Камень-Ножницы-Бумага" с ботами, скинами и заданиями!\n\nТвоя реферальная ссылка: ${url}`;
    
    if (window.Telegram?.WebApp) {
        // Используем Telegram Web App для шаринга
        Telegram.WebApp.openTelegramLink(url);
    } else if (navigator.share) {
        // Используем Web Share API
        navigator.share({
            title: 'Paper Win Rock',
            text: text,
            url: url
        });
    } else {
        copyReferalLink();
    }
}

// Настройки
function loadSettings() {
    // Загружаем текущие настройки
    const soundEffects = document.getElementById('sound-effects');
    const bgMusic = document.getElementById('bg-music');
    const darkTheme = document.getElementById('dark-theme');
    const animations = document.getElementById('animations');
    
    if (soundEffects) soundEffects.checked = userData.settings?.soundEffects !== false;
    if (bgMusic) bgMusic.checked = userData.settings?.bgMusic !== false;
    if (darkTheme) darkTheme.checked = userData.settings?.darkTheme || false;
    if (animations) animations.checked = userData.settings?.animations !== false;
}

function saveSettings() {
    const soundEffects = document.getElementById('sound-effects');
    const bgMusic = document.getElementById('bg-music');
    const darkTheme = document.getElementById('dark-theme');
    const animations = document.getElementById('animations');
    
    userData.settings = {
        soundEffects: soundEffects ? soundEffects.checked : true,
        bgMusic: bgMusic ? bgMusic.checked : true,
        darkTheme: darkTheme ? darkTheme.checked : false,
        animations: animations ? animations.checked : true
    };
    
    saveUserData();
    showNotification('Настройки сохранены!');
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
    const hintOverlay = document.getElementById('hint-overlay');
    if (hintOverlay) {
        hintOverlay.classList.add('hidden');
    }
}

// Дополнительные функции
function playAgain() {
    showScreen('difficulty');
}

function shareResult() {
    const text = `🎮 Я только что сыграл в Paper Win Rock! \n\nСтатистика:\n🏆 Побед: ${userData.wins || 0}\n💎 Алмазов: ${userData.diamonds || 0}\n\nПрисоединяйся: https://t.me/PaperWinRock_bot`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Paper Win Rock',
            text: text,
            url: 'https://t.me/PaperWinRock_bot'
        });
    } else {
        navigator.clipboard.writeText(text);
        showNotification('Результат скопирован в буфер обмена!');
    }
}

function surrender() {
    if (confirm('Вы уверены, что хотите сдаться?')) {
        userData.losses = (userData.losses || 0) + 1;
        userData.stats.winStreak = 0;
        saveUserData();
        updateUserUI();
        
        showNotification('Вы сдались. Попробуйте снова!');
        showScreen('main-menu');
        stopBattleTimer();
    }
}

function changeSkin(type) {
    showScreen('shop');
}

// Экспорт функций в глобальную область видимости
window.showScreen = showScreen;
window.startGame = startGame;
window.startBotGame = startBotGame;
window.makeChoice = makeChoice;
window.showHint = showHint;
window.closeHint = closeHint;
window.startPvPSearch = startPvPSearch;
window.cancelSearch = cancelSearch;
window.showSettings = showSettings;
window.saveSettings = saveSettings;
window.changeSkin = changeSkin;
window.copyReferalLink = copyReferalLink;
window.shareReferalLink = shareReferalLink;
window.claimTask = claimTask;
window.playAgain = playAgain;
window.shareResult = shareResult;
window.surrender = surrender;
window.buySkin = buySkin;
window.equipSkin = equipSkin;
window.loadTasks = loadTasks;

