// Конфигурация игры
const CONFIG = {
    SEARCH_TIMEOUT: 15000, // 15 секунд на поиск
    BATTLE_TIMEOUT: 10000, // 10 секунд на выбор
    ANIMATION_DURATION: 2000, // 2 секунды анимации
    RESULT_DELAY: 3000, // 3 секунды до результата
    REWARD_WIN: 5, // Алмазов за победу
    REWARD_DRAW: 1, // Алмазов за ничью
    REFERRAL_REWARD_NORMAL: 50, // За обычного пользователя
    REFERRAL_REWARD_PREMIUM: 250, // За Telegram Premium
    REFERRAL_MATCHES_REQUIRED: 3, // Матчей для активации реферала
    DAILY_QUEST_MATCHES: 5,
    DAILY_QUEST_REWARD: 100,
    STREAK_QUEST_WINS: 3,
    STREAK_QUEST_REWARD: 75,
    BOT_USERNAME: 'PaperWinRock_bot' // Добавлено имя бота
};

// Пути к ресурсам
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

// Фон для дисплеев выбора
const DISPLAY_BG_COLOR = 'rgba(255, 255, 255, 0.1)';

// Состояние игры
const gameState = {
    // Статистика
    diamonds: 0,
    wins: 0,
    losses: 0,
    streak: 0,
    battles: 0,
    referrals: 0,
    referralBonus: 0,
    
    // Задания
    dailyMatches: 0,
    dailyCompleted: false,
    streakWins: 0,
    streakCompleted: false,
    lastPlayedDate: null,
    
    // Настройки
    sound: true,
    darkTheme: true,
    
    // Текущая игра
    currentGame: null,
    searchTimer: null,
    battleTimer: null,
    round: 1,
    
    // Пользователь
    user: null,
    referralCode: null,
    
    // Рефералы
    referredUsers: {},
    referralData: {}
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
    
    // Обновляем задания
    updateQuests();
    
    // Имитируем загрузку
    setTimeout(function() {
        document.getElementById('loading-screen').classList.add('hidden');
        document.getElementById('main-menu').classList.remove('hidden');
        console.log('✅ Игра готова!');
    }, 2000);
    
    // Проверяем реферальную ссылку в URL
    checkReferralFromURL();
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
                
                // Генерируем реферальный код на основе ID пользователя
                if (user.id) {
                    gameState.referralCode = `PWR_${user.id.toString(36).toUpperCase()}`;
                    updateReferralLink();
                }
                
                console.log('🤖 Telegram пользователь:', user);
            }
        }
    } catch (error) {
        console.error('Ошибка инициализации Telegram:', error);
        
        // Тестовые данные для разработки
        gameState.user = {
            id: Date.now(),
            first_name: 'Тестовый Игрок',
            is_premium: false
        };
        gameState.referralCode = `PWR_TEST_${Date.now().toString(36).toUpperCase()}`;
        updateReferralLink();
    }
}

// Обновление реферальной ссылки
function updateReferralLink() {
    if (gameState.referralCode) {
        // Генерируем ссылку на Telegram бота
        const botLink = `https://t.me/${CONFIG.BOT_USERNAME}?start=${gameState.referralCode}`;
        document.getElementById('referral-link').value = botLink;
    }
}

// Копирование реферальной ссылки
function copyReferralLink() {
    const referralInput = document.getElementById('referral-link');
    referralInput.select();
    referralInput.setSelectionRange(0, 99999); // Для мобильных
    
    try {
        navigator.clipboard.writeText(referralInput.value).then(function() {
            showNotification('Ссылка на бота скопирована!');
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
        // Fallback для старых браузеров
        document.execCommand('copy');
        showNotification('Ссылка на бота скопирована!');
    }
}

// Поделиться реферальной ссылкой
function shareReferralLink() {
    if (!gameState.referralCode) return;
    
    const botLink = `https://t.me/${CONFIG.BOT_USERNAME}?start=${gameState.referralCode}`;
    const shareText = `🎮 Присоединяйся к Paper Win Rock!\n\nИграй в крутую игру "Камень-Ножницы-Бумага" с ботами, скинами и заданиями!\n\nТвоя реферальная ссылка: ${botLink}`;
    
    // Проверяем, находимся ли мы в Telegram Web App
    if (window.Telegram && Telegram.WebApp) {
        // В Telegram Web App используем Telegram Share
        if (Telegram.WebApp.openTelegramLink) {
            Telegram.WebApp.openTelegramLink(botLink);
        } else {
            // Fallback для старых версий
            const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(botLink)}&text=${encodeURIComponent(shareText)}`;
            window.open(shareUrl, '_blank');
        }
        showNotification('Открываю Telegram для отправки...');
    } else if (navigator.share) {
        // Используем Web Share API для мобильных браузеров
        navigator.share({
            title: 'Paper Win Rock',
            text: shareText,
            url: botLink
        }).then(() => {
            showNotification('Поделились успешно!');
        }).catch((error) => {
            console.log('Ошибка шаринга:', error);
            copyReferralLink(); // Fallback на копирование
        });
    } else {
        // Fallback: копируем ссылку
        copyReferralLink();
    }
}

// Проверка реферальной ссылки из URL
function checkReferralFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    
    if (refCode && gameState.user && gameState.user.id) {
        // Сохраняем информацию о реферале
        const referrerData = {
            referralCode: refCode,
            userId: gameState.user.id,
            isPremium: gameState.user.is_premium || false,
            matchesPlayed: 0,
            bonusAwarded: false,
            joinedAt: new Date().toISOString()
        };
        
        // Сохраняем в localStorage
        const referrals = JSON.parse(localStorage.getItem('referralsData') || '{}');
        referrals[gameState.user.id] = referrerData;
        localStorage.setItem('referralsData', JSON.stringify(referrals));
        
        console.log('📋 Реферал зарегистрирован:', referrerData);
        showNotification('Вы зашли по реферальной ссылке!');
    }
}

// Обновление статистики рефералов
function updateReferralStats() {
    // Загружаем данные о рефералах
    const referrals = JSON.parse(localStorage.getItem('referralsData') || '{}');
    let activeReferrals = 0;
    let totalBonus = 0;
    
    // Ищем рефералов текущего пользователя
    Object.values(referrals).forEach(referral => {
        if (referral.referralCode === gameState.referralCode) {
            if (referral.matchesPlayed >= CONFIG.REFERRAL_MATCHES_REQUIRED && !referral.bonusAwarded) {
                // Начисляем бонус
                const reward = referral.isPremium ? 
                    CONFIG.REFERRAL_REWARD_PREMIUM : 
                    CONFIG.REFERRAL_REWARD_NORMAL;
                
                gameState.diamonds += reward;
                totalBonus += reward;
                referral.bonusAwarded = true;
                activeReferrals++;
                
                showNotification(`+${reward} 💎 за реферала!`);
            } else if (referral.bonusAwarded) {
                activeReferrals++;
                totalBonus += referral.isPremium ? 
                    CONFIG.REFERRAL_REWARD_PREMIUM : 
                    CONFIG.REFERRAL_REWARD_NORMAL;
            }
        }
    });
    
    // Сохраняем обновленные данные
    localStorage.setItem('referralsData', JSON.stringify(referrals));
    
    // Обновляем статистику
    gameState.referrals = activeReferrals;
    gameState.referralBonus = totalBonus;
    
    // Обновляем UI
    document.getElementById('referrals-count').textContent = activeReferrals;
    document.getElementById('referrals-total').textContent = activeReferrals;
    document.getElementById('referrals-bonus').textContent = `${totalBonus} 💎`;
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
            gameState.dailyMatches = parsed.dailyMatches || 0;
            gameState.dailyCompleted = parsed.dailyCompleted || false;
            gameState.streakWins = parsed.streakWins || 0;
            gameState.streakCompleted = parsed.streakCompleted || false;
            gameState.lastPlayedDate = parsed.lastPlayedDate || null;
            gameState.sound = parsed.sound !== undefined ? parsed.sound : true;
            gameState.darkTheme = parsed.darkTheme !== undefined ? parsed.darkTheme : true;
            gameState.round = parsed.round || 1;
            
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
    document.getElementById('referrals-count').textContent = gameState.referrals;
    
    // Обновляем статистику рефералов
    updateReferralStats();
}

// Обновление заданий
function updateQuests() {
    // Проверяем сброс ежедневного задания
    const today = new Date().toDateString();
    if (gameState.lastPlayedDate !== today) {
        gameState.dailyMatches = 0;
        gameState.dailyCompleted = false;
        gameState.lastPlayedDate = today;
    }
    
    // Ежедневное задание
    const dailyProgress = (gameState.dailyMatches / CONFIG.DAILY_QUEST_MATCHES) * 100;
    document.getElementById('daily-progress').style.width = `${dailyProgress}%`;
    document.getElementById('daily-progress-text').textContent = 
        `${gameState.dailyMatches}/${CONFIG.DAILY_QUEST_MATCHES}`;
    
    const dailyBtn = document.getElementById('daily-claim-btn');
    if (gameState.dailyMatches >= CONFIG.DAILY_QUEST_MATCHES && !gameState.dailyCompleted) {
        dailyBtn.disabled = false;
        dailyBtn.style.opacity = '1';
    } else {
        dailyBtn.disabled = true;
        dailyBtn.style.opacity = '0.7';
    }
    
    // Задание на серию побед
    const streakProgress = (gameState.streakWins / CONFIG.STREAK_QUEST_WINS) * 100;
    document.getElementById('streak-progress').style.width = `${streakProgress}%`;
    document.getElementById('streak-progress-text').textContent = 
        `${gameState.streakWins}/${CONFIG.STREAK_QUEST_WINS}`;
    
    const streakBtn = document.getElementById('streak-claim-btn');
    if (gameState.streakWins >= CONFIG.STREAK_QUEST_WINS && !gameState.streakCompleted) {
        streakBtn.disabled = false;
        streakBtn.style.opacity = '1';
    } else {
        streakBtn.disabled = true;
        streakBtn.style.opacity = '0.7';
    }
}

// Получение награды за ежедневное задание
function claimDailyReward() {
    if (gameState.dailyMatches >= CONFIG.DAILY_QUEST_MATCHES && !gameState.dailyCompleted) {
        gameState.diamonds += CONFIG.DAILY_QUEST_REWARD;
        gameState.dailyCompleted = true;
        
        showNotification(`+${CONFIG.DAILY_QUEST_REWARD} 💎 за ежедневное задание!`);
        updateUI();
        updateQuests();
        saveGameState();
    }
}

// Получение награды за серию побед
function claimStreakReward() {
    if (gameState.streakWins >= CONFIG.STREAK_QUEST_WINS && !gameState.streakCompleted) {
        gameState.diamonds += CONFIG.STREAK_QUEST_REWARD;
        gameState.streakCompleted = true;
        
        showNotification(`+${CONFIG.STREAK_QUEST_REWARD} 💎 за серию побед!`);
        updateUI();
        updateQuests();
        saveGameState();
    }
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
    
    // Обновляем квесты при показе экрана заданий
    if (screenId === 'quests') {
        updateQuests();
    }
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
    
    // Сброс отображения боя
    resetBattleDisplay();
    
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
    // Устанавливаем анимацию боя как фон
    playerDisplay.style.background = `url(${ASSETS.ANIMATIONS.FIGHT}) no-repeat center/contain, ${DISPLAY_BG_COLOR}`;
    opponentDisplay.style.background = `url(${ASSETS.ANIMATIONS.FIGHT}) no-repeat center/contain, ${DISPLAY_BG_COLOR}`;
    
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
    
    // Обновляем лог
    const choiceNames = {
        rock: 'Камень',
        paper: 'Бумага',
        scissors: 'Ножницы'
    };
    
    document.getElementById('battle-log').innerHTML = 
        `<div class="log-entry">Вы выбрали ${choiceNames[choice]}!</div>`;
    
    // Ждём 1 секунду и показываем повторную анимацию боя
    setTimeout(function() {
        showFinalFightAnimation();
    }, 1000);
}

// Показать финальную анимацию боя (перед выбором)
function showFinalFightAnimation() {
    const playerDisplay = document.getElementById('player-choice-display');
    const opponentDisplay = document.getElementById('opponent-choice-display');
    
    console.log('🎬 Показываем финальную анимацию боя...');
    
    // Обновляем лог
    document.getElementById('battle-log').innerHTML += 
        '<div class="log-entry">СРАЖЕНИЕ!</div>';
    
    // Показываем анимацию боя ещё раз (1 цикл)
    playerDisplay.style.background = `url(${ASSETS.ANIMATIONS.FIGHT}) no-repeat center/contain, ${DISPLAY_BG_COLOR}`;
    playerDisplay.style.transform = 'scaleX(-1)'; // Отражаем анимацию игрока
    playerDisplay.classList.add('fighting');
    
    opponentDisplay.style.background = `url(${ASSETS.ANIMATIONS.FIGHT}) no-repeat center/contain, ${DISPLAY_BG_COLOR}`;
    opponentDisplay.style.transform = 'scaleX(1)'; // Анимация бота не отражается
    opponentDisplay.classList.add('fighting');
    
    // Через 1 секунду бот делает выбор
    setTimeout(function() {
        botMakeChoice(gameState.currentGame.playerChoice);
    }, 1000);
}

// Бот делает выбор
function botMakeChoice(playerChoice) {
    if (!gameState.currentGame) return;
    
    let opponentChoice;
    
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
    
    gameState.currentGame.opponentChoice = opponentChoice;
    
    // Обновляем лог
    const choiceNames = {
        rock: 'Камень',
        paper: 'Бумага',
        scissors: 'Ножницы'
    };
    
    document.getElementById('battle-log').innerHTML += 
        `<div class="log-entry">Противник выбрал ${choiceNames[opponentChoice]}!</div>`;
    
    // Ждём 0.5 секунды и запускаем анимацию выборов
    setTimeout(function() {
        startChoiceAnimations(playerChoice, opponentChoice);
    }, 500);
}

// Запуск анимации выборов
function startChoiceAnimations(playerChoice, opponentChoice) {
    const playerDisplay = document.getElementById('player-choice-display');
    const opponentDisplay = document.getElementById('opponent-choice-display');
    
    console.log('🎬 Запускаем анимацию выборов...');
    
    // Запускаем GIF анимации выборов
    playerDisplay.style.background = `url(${ASSETS.ANIMATIONS[playerChoice.toUpperCase()]}) no-repeat center/contain, ${DISPLAY_BG_COLOR}`;
    playerDisplay.style.transform = 'scaleX(-1)'; // Отражаем анимацию игрока
    playerDisplay.classList.remove('fighting');
    
    opponentDisplay.style.background = `url(${ASSETS.ANIMATIONS[opponentChoice.toUpperCase()]}) no-repeat center/contain, ${DISPLAY_BG_COLOR}`;
    opponentDisplay.style.transform = 'scaleX(1)'; // Анимация бота не отражается
    opponentDisplay.classList.remove('fighting');
    
    // Обновляем лог
    document.getElementById('battle-log').innerHTML += 
        '<div class="log-entry">Показываем выборы!</div>';
    
    // Через 2 секунды возвращаем PNG и показываем результат
    setTimeout(function() {
        showFinalChoices(playerChoice, opponentChoice);
    }, CONFIG.ANIMATION_DURATION);
}

// Показать финальные выборы (PNG) и результат
function showFinalChoices(playerChoice, opponentChoice) {
    const playerDisplay = document.getElementById('player-choice-display');
    const opponentDisplay = document.getElementById('opponent-choice-display');
    
    // Показываем PNG выборов
    playerDisplay.style.background = `url(${ASSETS.ICONS[playerChoice.toUpperCase()]}) no-repeat center/contain, ${DISPLAY_BG_COLOR}`;
    playerDisplay.style.transform = 'scaleX(-1)';
    
    opponentDisplay.style.background = `url(${ASSETS.ICONS[opponentChoice.toUpperCase()]}) no-repeat center/contain, ${DISPLAY_BG_COLOR}`;
    opponentDisplay.style.transform = 'scaleX(1)';
    
    // Обновляем лог
    document.getElementById('battle-log').innerHTML += 
        '<div class="log-entry">Подводим итоги...</div>';
    
    // Ждём ещё 1 секунду и показываем результат
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
    let resultMessage;
    let reward = 0;
    
    if (playerChoice === opponentChoice) {
        result = 'draw';
        resultTitle = 'НИЧЬЯ!';
        resultMessage = 'Одинаковый выбор!';
        reward = CONFIG.REWARD_DRAW;
        
        // Ничья - сохраняем серию
        gameState.streakWins = 0;
    } else if (results[playerChoice].beats === opponentChoice) {
        result = 'win';
        resultTitle = 'ПОБЕДА!';
        resultMessage = 'Вы победили в бою!';
        reward = CONFIG.REWARD_WIN;
        
        // Обновляем статистику
        gameState.wins++;
        gameState.streak++;
        gameState.streakWins++;
        gameState.diamonds += reward;
    } else {
        result = 'lose';
        resultTitle = 'ПОРАЖЕНИЕ';
        resultMessage = 'Попробуйте ещё раз!';
        gameState.streak = 0;
        gameState.streakWins = 0;
    }
    
    // Обновляем общую статистику
    gameState.battles++;
    gameState.dailyMatches++;
    
    // Обновляем счетчик матчей для рефералов
    updateReferralMatchesCount();
    
    // Сохраняем состояние
    saveGameState();
    updateUI();
    updateQuests();
    
    // Показываем экран результата
    showResultScreen(result, resultTitle, resultMessage, reward, playerChoice, opponentChoice);
}

// Обновление счетчика матчей для рефералов
function updateReferralMatchesCount() {
    if (!gameState.user || !gameState.user.id) return;
    
    const referrals = JSON.parse(localStorage.getItem('referralsData') || '{}');
    const userData = referrals[gameState.user.id];
    
    if (userData && !userData.bonusAwarded) {
        userData.matchesPlayed++;
        referrals[gameState.user.id] = userData;
        localStorage.setItem('referralsData', JSON.stringify(referrals));
        
        console.log(`📊 Реферал сыграл матчей: ${userData.matchesPlayed}`);
        
        // Если достигли лимита, обновляем статистику
        if (userData.matchesPlayed >= CONFIG.REFERRAL_MATCHES_REQUIRED) {
            updateReferralStats();
        }
    }
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
    // Сбрасываем текущую игру
    gameState.currentGame = null;
    
    // Сбрасываем отображение боя
    resetBattleDisplay();
    
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
window.copyReferralLink = copyReferralLink;
window.shareReferralLink = shareReferralLink;
window.claimDailyReward = claimDailyReward;
window.claimStreakReward = claimStreakReward;
