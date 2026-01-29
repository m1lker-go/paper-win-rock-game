// Инициализация Telegram Mini App
const tg = window.Telegram.WebApp;
tg.expand();
tg.setHeaderColor('#2d3436');
tg.setBackgroundColor('#2d3436');

// Глобальные переменные
let userData = {
    id: null,
    username: 'Игрок',
    diamonds: 100,
    wins: 0,
    losses: 0,
    equippedSkins: {
        rock: 'default',
        paper: 'default',
        scissors: 'default'
    },
    ownedSkins: ['default'],
    referals: [],
    referalCode: null,
    dailyTasks: {}
};

let gameState = {
    searching: false,
    battleActive: false,
    currentChoice: null,
    opponent: null,
    searchTimer: null,
    actionTimer: null,
    timeLeft: 10
};

// Скины доступные в магазине
const shopSkins = {
    rock: [
        { id: 'rock_default', name: 'Обычный камень', price: 0, emoji: '✊', type: 'rock' },
        { id: 'rock_gold', name: 'Золотой камень', price: 50, emoji: '🪨', type: 'rock' },
        { id: 'rock_lava', name: 'Лавовый камень', price: 100, emoji: '🔥', type: 'rock' },
        { id: 'rock_ice', name: 'Ледяной камень', price: 150, emoji: '❄️', type: 'rock' },
        { id: 'rock_diamond', name: 'Алмазный камень', price: 500, emoji: '💎', type: 'rock' }
    ],
    paper: [
        { id: 'paper_default', name: 'Обычная бумага', price: 0, emoji: '✋', type: 'paper' },
        { id: 'paper_gold', name: 'Золотая бумага', price: 50, emoji: '📜', type: 'paper' },
        { id: 'paper_money', name: 'Денежная бумага', price: 100, emoji: '💰', type: 'paper' },
        { id: 'paper_map', name: 'Карта сокровищ', price: 150, emoji: '🗺️', type: 'paper' },
        { id: 'paper_magic', name: 'Магический свиток', price: 500, emoji: '✨', type: 'paper' }
    ],
    scissors: [
        { id: 'scissors_default', name: 'Обычные ножницы', price: 0, emoji: '✌️', type: 'scissors' },
        { id: 'scissors_gold', name: 'Золотые ножницы', price: 50, emoji: '✂️', type: 'scissors' },
        { id: 'scissors_sword', name: 'Меч-ножницы', price: 100, emoji: '⚔️', type: 'scissors' },
        { id: 'scissors_laser', name: 'Лазерные ножницы', price: 150, emoji: '🔪', type: 'scissors' },
        { id: 'scissors_dragon', name: 'Драконьи когти', price: 500, emoji: '🐉', type: 'scissors' }
    ]
};

// Задачи
const dailyTasks = [
    { id: 'play_3', name: 'Сыграть 3 матча', target: 3, reward: 25 },
    { id: 'win_5', name: 'Выиграть 5 матчей', target: 5, reward: 50 },
    { id: 'equip_skin', name: 'Надеть скин', target: 1, reward: 15 },
    { id: 'daily_login', name: 'Ежедневный вход', target: 1, reward: 10 }
];

// Инициализация
document.addEventListener('DOMContentLoaded', async () => {
    // Загрузка данных пользователя
    await loadUserData();
    
    // Показ экрана загрузки
    simulateLoading();
    
    // Обновление интерфейса
    updateUI();
    
    // Инициализация слушателей
    initEventListeners();
    
    // Генерация реферальной ссылки
    generateReferalLink();
    
    // Загрузка задач
    loadTasks();
});

// Симуляция загрузки
function simulateLoading() {
    let progress = 0;
    const progressBar = document.querySelector('.progress');
    const loadingScreen = document.getElementById('loading-screen');
    
    const interval = setInterval(() => {
        progress += 1;
        progressBar.style.width = progress + '%';
        
        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
                showScreen('main-menu');
            }, 500);
        }
    }, 30);
}

// Загрузка данных пользователя
async function loadUserData() {
    const savedData = localStorage.getItem('paperWinRock_userData');
    
    if (savedData) {
        userData = JSON.parse(savedData);
    } else {
        // Новый пользователь
        userData.id = Date.now().toString();
        userData.referalCode = generateReferalCode();
        
        if (tg.initDataUnsafe.user) {
            const tgUser = tg.initDataUnsafe.user;
            userData.username = tgUser.first_name || 'Игрок';
            userData.id = tgUser.id.toString();
        }
        
        saveUserData();
    }
}

// Сохранение данных пользователя
function saveUserData() {
    localStorage.setItem('paperWinRock_userData', JSON.stringify(userData));
}

// Обновление интерфейса
function updateUI() {
    // Обновление алмазов
    document.getElementById('diamond-count').textContent = userData.diamonds;
    document.getElementById('shop-diamonds').textContent = userData.diamonds;
    
    // Обновление статистики
    document.getElementById('total-wins').textContent = userData.wins;
    document.getElementById('total-losses').textContent = userData.losses;
    
    // Обновление реферальной статистики
    document.getElementById('referal-count').textContent = userData.referals.length;
    document.getElementById('referal-matches').textContent = '0/3';
    
    // Обновление скинов
    updateEquippedSkins();
}

// Обновление надетых скинов
function updateEquippedSkins() {
    const rockSkin = userData.equippedSkins.rock;
    const paperSkin = userData.equippedSkins.paper;
    const scissorsSkin = userData.equippedSkins.scissors;
    
    // Находим эмодзи для скинов
    const findEmoji = (type, skinId) => {
        const skins = shopSkins[type];
        const skin = skins.find(s => s.id === skinId);
        return skin ? skin.emoji : '❓';
    };
    
    document.getElementById('rock-skin').textContent = findEmoji('rock', rockSkin);
    document.getElementById('paper-skin').textContent = findEmoji('paper', paperSkin);
    document.getElementById('scissors-skin').textContent = findEmoji('scissors', scissorsSkin);
}

// Показать экран
function showScreen(screenName) {
    // Скрыть все экраны
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
        screen.classList.add('hidden');
    });
    
    // Показать выбранный экран
    const targetScreen = document.getElementById(`${screenName}-screen`);
    if (targetScreen) {
        targetScreen.classList.remove('hidden');
    }
    
    // Загрузка данных для экрана
    switch(screenName) {
        case 'shop':
            loadShop();
            break;
        case 'backpack':
            loadBackpack();
            break;
        case 'tasks':
            loadTasks();
            break;
    }
}

// Поиск противника
function startSearch() {
    if (gameState.searching) return;
    
    gameState.searching = true;
    gameState.battleActive = false;
    gameState.currentChoice = null;
    
    // Показать экран поиска
    document.getElementById('searching-screen').classList.remove('hidden');
    document.getElementById('battle-game').classList.add('hidden');
    document.getElementById('battle-result').classList.add('hidden');
    
    // Таймер поиска (15 секунд)
    let searchTime = 15;
    const searchTimeElement = document.getElementById('search-time');
    
    gameState.searchTimer = setInterval(() => {
        searchTime--;
        searchTimeElement.textContent = searchTime;
        
        // Если время вышло, играем с ботом
        if (searchTime <= 0) {
            clearInterval(gameState.searchTimer);
            startBattleWithBot();
        }
    }, 1000);
    
    // Симуляция поиска игрока (50% шанс найти за 3-10 секунд)
    const playerSearchTime = Math.random() * 7000 + 3000;
    
    setTimeout(() => {
        if (gameState.searching && Math.random() > 0.5) {
            // Нашли игрока
            clearInterval(gameState.searchTimer);
            startBattleWithPlayer();
        }
    }, playerSearchTime);
}

// Отмена поиска
function cancelSearch() {
    if (!gameState.searching) return;
    
    gameState.searching = false;
    clearInterval(gameState.searchTimer);
    
    showNotification('Поиск отменен');
    showScreen('battle');
}

// Начать бой с ботом
function startBattleWithBot() {
    gameState.searching = false;
    gameState.battleActive = true;
    gameState.opponent = {
        name: 'Бот 🤖',
        isBot: true,
        choice: null
    };
    
    // Обновить имена игроков
    document.getElementById('player1-name').textContent = userData.username;
    document.getElementById('player2-name').textContent = gameState.opponent.name;
    
    // Показать игровое поле
    document.getElementById('searching-screen').classList.add('hidden');
    document.getElementById('battle-game').classList.remove('hidden');
    
    // Сброс выбора
    document.getElementById('player1-choice').textContent = '❓';
    document.getElementById('player2-choice').textContent = '❓';
    
    // Запуск таймера на ход
    startActionTimer();
}

// Начать бой с игроком
function startBattleWithPlayer() {
    gameState.searching = false;
    gameState.battleActive = true;
    gameState.opponent = {
        name: 'Игрок 👤',
        isBot: false,
        choice: null
    };
    
    // Обновить имена игроков
    document.getElementById('player1-name').textContent = userData.username;
    document.getElementById('player2-name').textContent = gameState.opponent.name;
    
    // Показать игровое поле
    document.getElementById('searching-screen').classList.add('hidden');
    document.getElementById('battle-game').classList.remove('hidden');
    
    // Сброс выбора
    document.getElementById('player1-choice').textContent = '❓';
    document.getElementById('player2-choice').textContent = '❓';
    
    // Запуск таймера на ход
    startActionTimer();
}

// Запуск таймера на ход
function startActionTimer() {
    gameState.timeLeft = 10;
    const timerElement = document.getElementById('action-timer');
    const battleLog = document.getElementById('battle-log');
    
    timerElement.textContent = gameState.timeLeft;
    battleLog.textContent = 'Выберите ваш ход!';
    
    clearInterval(gameState.actionTimer);
    
    gameState.actionTimer = setInterval(() => {
        gameState.timeLeft--;
        timerElement.textContent = gameState.timeLeft;
        
        if (gameState.timeLeft <= 0) {
            clearInterval(gameState.actionTimer);
            
            if (!gameState.currentChoice) {
                // Игрок не сделал выбор - техническое поражение
                makeChoice('timeout');
            }
        } else if (gameState.timeLeft <= 3) {
            timerElement.style.color = '#e74c3c';
            timerElement.style.animation = 'pulse 0.5s infinite';
        }
    }, 1000);
}

// Сделать выбор
function makeChoice(choice) {
    if (!gameState.battleActive || gameState.currentChoice) return;
    
    gameState.currentChoice = choice;
    
    // Показать выбор игрока
    const choiceEmoji = getChoiceEmoji(choice);
    document.getElementById('player1-choice').textContent = choiceEmoji;
    document.getElementById('player1-choice').style.animation = 'bounce 0.5s';
    
    // Блокировка кнопок выбора
    document.querySelectorAll('.choice-btn').forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.5';
    });
    
    // Лог
    document.getElementById('battle-log').textContent = 'Ждем выбор противника...';
    
    // Противник делает выбор
    setTimeout(() => {
        opponentMakeChoice();
    }, 1000);
}

// Противник делает выбор
function opponentMakeChoice() {
    if (!gameState.opponent) return;
    
    let opponentChoice;
    
    if (gameState.opponent.isBot) {
        // Бот делает случайный выбор через 1-4 секунды
        const botThinkTime = Math.random() * 3000 + 1000;
        
        setTimeout(() => {
            const choices = ['rock', 'paper', 'scissors'];
            opponentChoice = choices[Math.floor(Math.random() * 3)];
            gameState.opponent.choice = opponentChoice;
            
            // Показать выбор бота
            const choiceEmoji = getChoiceEmoji(opponentChoice);
            document.getElementById('player2-choice').textContent = choiceEmoji;
            document.getElementById('player2-choice').style.animation = 'bounce 0.5s';
            
            // Определить результат
            setTimeout(() => {
                determineWinner();
            }, 1000);
        }, botThinkTime);
    } else {
        // Игрок-человек (симуляция)
        setTimeout(() => {
            const choices = ['rock', 'paper', 'scissors'];
            opponentChoice = choices[Math.floor(Math.random() * 3)];
            gameState.opponent.choice = opponentChoice;
            
            // Показать выбор игрока
            const choiceEmoji = getChoiceEmoji(opponentChoice);
            document.getElementById('player2-choice').textContent = choiceEmoji;
            document.getElementById('player2-choice').style.animation = 'bounce 0.5s';
            
            // Определить результат
            setTimeout(() => {
                determineWinner();
            }, 1000);
        }, 2000);
    }
}

// Определить победителя
function determineWinner() {
    clearInterval(gameState.actionTimer);
    gameState.battleActive = false;
    
    const playerChoice = gameState.currentChoice;
    const opponentChoice = gameState.opponent.choice;
    
    let result;
    let resultText;
    let reward = 0;
    
    // Определение победителя
    if (playerChoice === 'timeout') {
        result = 'lose';
        resultText = 'ТЕХНИЧЕСКОЕ ПОРАЖЕНИЕ';
        reward = 0;
    } else if (playerChoice === opponentChoice) {
        result = 'draw';
        resultText = 'НИЧЬЯ!';
        reward = 2;
    } else if (
        (playerChoice === 'rock' && opponentChoice === 'scissors') ||
        (playerChoice === 'paper' && opponentChoice === 'rock') ||
        (playerChoice === 'scissors' && opponentChoice === 'paper')
    ) {
        result = 'win';
        resultText = 'ПОБЕДА!';
        reward = 5;
        userData.wins++;
    } else {
        result = 'lose';
        resultText = 'ПОРАЖЕНИЕ';
        reward = 0;
        userData.losses++;
    }
    
    // Начисление алмазов
    if (reward > 0) {
        userData.diamonds += reward;
        showNotification(`+${reward} алмазов!`);
    }
    
    // Обновление UI
    updateUI();
    saveUserData();
    
    // Показать результат
    setTimeout(() => {
        showBattleResult(result, resultText, reward);
    }, 1000);
}

// Показать результат боя
function showBattleResult(result, resultText, reward) {
    document.getElementById('battle-game').classList.add('hidden');
    document.getElementById('battle-result').classList.remove('hidden');
    
    const resultTitle = document.getElementById('result-title');
    const resultIcon = document.getElementById('result-icon');
    const rewardAmount = document.getElementById('reward-amount');
    
    resultTitle.textContent = resultText;
    resultTitle.className = `result-title ${result}`;
    
    // Установка иконки
    if (result === 'win') {
        resultIcon.textContent = '🏆';
        resultIcon.style.color = '#00b894';
    } else if (result === 'lose') {
        resultIcon.textContent = '💔';
        resultIcon.style.color = '#e74c3c';
    } else {
        resultIcon.textContent = '🤝';
        resultIcon.style.color = '#fdcb6e';
    }
    
    // Награда
    if (reward > 0) {
        rewardAmount.textContent = `+${reward} алмазов`;
    } else {
        rewardAmount.textContent = 'Нет награды';
    }
}

// Получить эмодзи для выбора
function getChoiceEmoji(choice) {
    switch(choice) {
        case 'rock':
            return document.getElementById('rock-skin').textContent;
        case 'paper':
            return document.getElementById('paper-skin').textContent;
        case 'scissors':
            return document.getElementById('scissors-skin').textContent;
        default:
            return '❓';
    }
}

// Загрузка магазина
function loadShop() {
    const tab = document.querySelector('.shop-tabs .tab-btn.active').textContent.toLowerCase();
    const itemsContainer = document.getElementById('shop-items');
    
    itemsContainer.innerHTML = '';
    
    const skins = shopSkins[tab] || [];
    
    skins.forEach(skin => {
        const isOwned = userData.ownedSkins.includes(skin.id);
        const isEquipped = userData.equippedSkins[skin.type] === skin.id;
        const canAfford = userData.diamonds >= skin.price;
        
        const skinCard = document.createElement('div');
        skinCard.className = `skin-card ${isOwned ? 'owned' : ''} ${isEquipped ? 'equipped' : ''}`;
        
        skinCard.innerHTML = `
            <div class="skin-icon">${skin.emoji}</div>
            <div class="skin-name">${skin.name}</div>
            <div class="skin-price">
                <i class="fas fa-gem"></i> ${skin.price}
            </div>
            <div class="skin-actions">
                ${isOwned 
                    ? (isEquipped 
                        ? `<button class="action-btn unequip-btn" onclick="unequipSkin('${skin.id}')">
                            <i class="fas fa-times"></i> Снять
                           </button>`
                        : `<button class="action-btn equip-btn" onclick="equipSkin('${skin.id}', '${skin.type}')">
                            <i class="fas fa-check"></i> Надеть
                           </button>`)
                    : `<button class="action-btn buy-btn" 
                         onclick="buySkin('${skin.id}', ${skin.price}, '${skin.type}')"
                         ${canAfford ? '' : 'disabled'}>
                         <i class="fas fa-shopping-cart"></i> 
                         ${canAfford ? 'Купить' : 'Не хватает'}
                       </button>`
                }
            </div>
        `;
        
        itemsContainer.appendChild(skinCard);
    });
}

// Загрузка рюкзака
function loadBackpack() {
    const tab = document.querySelector('.backpack-tabs .tab-btn.active').textContent;
    const itemsContainer = document.getElementById('backpack-items');
    
    itemsContainer.innerHTML = '';
    
    let skins = [];
    
    // Собрать все скины пользователя
    Object.keys(shopSkins).forEach(type => {
        shopSkins[type].forEach(skin => {
            if (userData.ownedSkins.includes(skin.id)) {
                skins.push(skin);
            }
        });
    });
    
    // Фильтрация по вкладке
    if (tab === 'Надето') {
        skins = skins.filter(skin => userData.equippedSkins[skin.type] === skin.id);
    }
    
    // Отображение скинов
    skins.forEach(skin => {
        const isEquipped = userData.equippedSkins[skin.type] === skin.id;
        
        const skinCard = document.createElement('div');
        skinCard.className = `skin-card ${isEquipped ? 'equipped' : ''}`;
        
        skinCard.innerHTML = `
            <div class="skin-icon">${skin.emoji}</div>
            <div class="skin-name">${skin.name}</div>
            <div class="skin-type">${getSkinTypeName(skin.type)}</div>
            <div class="skin-actions">
                ${isEquipped 
                    ? `<button class="action-btn unequip-btn" onclick="unequipSkin('${skin.id}')">
                        <i class="fas fa-times"></i> Снять
                       </button>`
                    : `<button class="action-btn equip-btn" onclick="equipSkin('${skin.id}', '${skin.type}')">
                        <i class="fas fa-check"></i> Надеть
                       </button>`
                }
            </div>
        `;
        
        itemsContainer.appendChild(skinCard);
    });
}

// Покупка скина
function buySkin(skinId, price, type) {
    if (userData.diamonds < price) {
        showNotification('Не хватает алмазов!');
        return;
    }
    
    userData.diamonds -= price;
    userData.ownedSkins.push(skinId);
    
    // Автоматически надеваем купленный скин
    equipSkin(skinId, type);
    
    showNotification(`Скин куплен! -${price} алмазов`);
    updateUI();
    saveUserData();
    
    // Перезагрузка магазина
    loadShop();
}

// Надеть скин
function equipSkin(skinId, type) {
    // Снимаем текущий скин этого типа
    userData.equippedSkins[type] = skinId;
    
    showNotification('Скин надет!');
    updateEquippedSkins();
    saveUserData();
    
    // Перезагрузка магазина и рюкзака
    loadShop();
    loadBackpack();
}

// Снять скин
function unequipSkin(skinId) {
    // Находим тип скина
    let skinType = null;
    Object.keys(shopSkins).forEach(type => {
        const skin = shopSkins[type].find(s => s.id === skinId);
        if (skin) skinType = type;
    });
    
    if (skinType) {
        // Возвращаем дефолтный скин
        userData.equippedSkins[skinType] = `${skinType}_default`;
        
        showNotification('Скин снят!');
        updateEquippedSkins();
        saveUserData();
        
        // Перезагрузка магазина и рюкзака
        loadShop();
        loadBackpack();
    }
}

// Получить название типа скина
function getSkinTypeName(type) {
    switch(type) {
        case 'rock': return 'Камень';
        case 'paper': return 'Бумага';
        case 'scissors': return 'Ножницы';
        default: return type;
    }
}

// Показать вкладку магазина
function showShopTab(tab) {
    document.querySelectorAll('.shop-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    event.target.classList.add('active');
    loadShop();
}

// Показать вкладку рюкзака
function showBackpackTab(tab) {
    document.querySelectorAll('.backpack-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    event.target.classList.add('active');
    loadBackpack();
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

// Генерация реферальной ссылки
function generateReferalLink() {
    const baseUrl = `https://t.me/${tg.initDataUnsafe.user?.username || 'PaperWinRock_bot'}?start=ref_${userData.referalCode}`;
    document.getElementById('referal-url').value = baseUrl;
}

// Копирование реферальной ссылки
function copyReferalLink() {
    const input = document.getElementById('referal-url');
    input.select();
    input.setSelectionRange(0, 99999);
    
    navigator.clipboard.writeText(input.value).then(() => {
        showNotification('Ссылка скопирована!');
    });
}

// Загрузка задач
function loadTasks() {
    const tasksContainer = document.getElementById('daily-tasks');
    
    if (!tasksContainer) return;
    
    tasksContainer.innerHTML = '';
    
    dailyTasks.forEach(task => {
        const progress = userData.dailyTasks[task.id] || 0;
        const completed = progress >= task.target;
        
        const taskElement = document.createElement('div');
        taskElement.className = `task-card ${completed ? 'completed' : ''}`;
        
        taskElement.innerHTML = `
            <div class="task-icon">${completed ? '✅' : '🎯'}</div>
            <div class="task-info">
                <h3>${task.name}</h3>
                <p>Прогресс: ${progress}/${task.target}</p>
                <div class="task-reward">
                    <i class="fas fa-gem"></i>
                    <span>Награда: ${task.reward} алмазов</span>
                </div>
            </div>
            <div class="task-status">
                ${completed 
                    ? '<button class="action-btn equip-btn" disabled>Получено</button>'
                    : `<button class="action-btn buy-btn" onclick="claimTask('${task.id}')">Забрать</button>`
                }
            </div>
        `;
        
        tasksContainer.appendChild(taskElement);
    });
}

// Забрать награду за задание
function claimTask(taskId) {
    const task = dailyTasks.find(t => t.id === taskId);
    if (!task) return;
    
    const progress = userData.dailyTasks[taskId] || 0;
    
    if (progress >= task.target) {
        userData.diamonds += task.reward;
        userData.dailyTasks[taskId] = 0; // Сброс прогресса
        
        showNotification(`+${task.reward} алмазов за задание!`);
        updateUI();
        saveUserData();
        loadTasks();
    } else {
        showNotification('Задание еще не выполнено!');
    }
}

// Обновление прогресса задач
function updateTaskProgress(taskId, amount = 1) {
    if (!userData.dailyTasks[taskId]) {
        userData.dailyTasks[taskId] = 0;
    }
    
    userData.dailyTasks[taskId] += amount;
    saveUserData();
}

// Показать уведомление
function showNotification(text) {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notification-text');
    
    notificationText.textContent = text;
    notification.classList.remove('hidden');
    
    // Автоматическое скрытие через 3 секунды
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 3000);
}

// Инициализация слушателей событий
function initEventListeners() {
    // Обработка ежедневного входа
    const lastLogin = localStorage.getItem('lastLogin');
    const today = new Date().toDateString();
    
    if (lastLogin !== today) {
        updateTaskProgress('daily_login', 1);
        localStorage.setItem('lastLogin', today);
    }
}

// Инициализация при полной загрузке
window.addEventListener('load', () => {
    tg.ready();
});
