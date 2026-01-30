// Глобальные переменные
let currentScreen = 'loading';
let userData = null;
let currentGame = null;
let selectedDifficulty = 'medium';
let gameTimer = null;
let searchTimer = null;

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Игра загружается...');
    
    // Инициализация Telegram Web App
    if (window.Telegram.WebApp) {
        Telegram.WebApp.ready();
        Telegram.WebApp.expand();
        
        const user = Telegram.WebApp.initDataUnsafe?.user;
        if (user) {
            userData = {
                id: user.id.toString(),
                username: user.username || `Игрок_${user.id.toString().slice(0, 4)}`,
                firstName: user.first_name || 'Игрок',
                isPremium: Telegram.WebApp.initDataUnsafe?.user?.is_premium || false
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
    
    // Загружаем данные пользователя с сервера
    await loadUserData();
    
    // Показываем главное меню через 2 секунды
    setTimeout(() => {
        showScreen('main-menu');
        updateUserUI();
    }, 2000);
});

// Загрузка данных пользователя
async function loadUserData() {
    try {
        const response = await fetch(`/api/user/${userData.id}`);
        if (response.ok) {
            const data = await response.json();
            if (data && data.id) {
                userData = { ...userData, ...data };
            } else {
                // Если пользователя нет, создаем нового
                await createUser();
            }
        } else {
            await createUser();
        }
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        await createUser();
    }
}

// Создание нового пользователя
async function createUser() {
    try {
        const response = await fetch(`/api/user/${userData.id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: userData.username,
                diamonds: 100,
                wins: 0,
                losses: 0
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            userData = { ...userData, ...data };
        }
    } catch (error) {
        console.error('Ошибка создания пользователя:', error);
    }
}

// Показать экран
function showScreen(screenId) {
    // Скрыть текущий экран
    if (currentScreen) {
        const currentScreenElement = document.getElementById(`${currentScreen}-screen`);
        if (currentScreenElement) {
            currentScreenElement.classList.remove('active');
        }
    }
    
    // Показать новый экран
    const screenElement = document.getElementById(`${screenId}-screen`);
    if (screenElement) {
        screenElement.classList.add('active');
        currentScreen = screenId;
    }
    
    // Специальная логика для разных экранов
    switch (screenId) {
        case 'main-menu':
            updateUserUI();
            break;
        case 'battle':
            startBattleTimer();
            break;
        case 'difficulty':
            loadDifficultyScreen();
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
    }
}

// Обновить UI пользователя
function updateUserUI() {
    if (!userData) return;
    
    // Обновить имя
    const usernameElement = document.getElementById('username');
    if (usernameElement) {
        usernameElement.textContent = userData.firstName || userData.username;
    }
    
    // Обновить алмазы
    const diamondElement = document.getElementById('diamond-count');
    if (diamondElement && userData.diamonds !== undefined) {
        diamondElement.textContent = userData.diamonds;
    }
    
    // Обновить статистику
    updateStats();
}

// Обновить статистику
function updateStats() {
    if (!userData) return;
    
    const stats = {
        wins: userData.wins || 0,
        losses: userData.losses || 0,
        streak: userData.stats?.winStreak || 0
    };
    
    document.getElementById('stat-wins')?.textContent = stats.wins;
    document.getElementById('stat-losses')?.textContent = stats.losses;
    document.getElementById('stat-streak')?.textContent = stats.streak;
}

// Загрузка экрана выбора сложности
function loadDifficultyScreen() {
    const container = document.querySelector('.difficulty-options');
    if (!container) return;
    
    const difficulties = [
        { id: 'easy', name: 'НОВИЧОК', icon: '😊', reward: 3, desc: 'Идеально для начала' },
        { id: 'medium', name: 'ОПЫТНЫЙ', icon: '😎', reward: 5, desc: 'Сбалансированная игра' },
        { id: 'hard', name: 'ЭКСПЕРТ', icon: '🤖', reward: 10, desc: 'Для настоящих чемпионов' }
    ];
    
    container.innerHTML = difficulties.map(diff => `
        <button class="difficulty-btn ${diff.id}" onclick="startBotGame('${diff.id}')">
            <div class="difficulty-icon">${diff.icon}</div>
            <div class="difficulty-info">
                <h3>${diff.name}</h3>
                <p>${diff.desc}</p>
                <div class="reward-info">Награда: +${diff.reward} алмазов</div>
            </div>
        </button>
    `).join('');
}

// Начать игру с ботом
async function startBotGame(difficulty) {
    selectedDifficulty = difficulty;
    
    try {
        const response = await fetch('/api/game/bot', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: userData.id,
                difficulty: difficulty
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            currentGame = data;
            
            // Обновить UI боя
            document.getElementById('battle-mode').textContent = 'БОЙ С БОТОМ';
            document.getElementById('player2-name').textContent = data.bot.name;
            document.getElementById('player2-difficulty').textContent = 
                difficulty === 'easy' ? 'Новичок' : 
                difficulty === 'medium' ? 'Средний' : 'Эксперт';
            
            // Очистить лог
            const log = document.getElementById('battle-log');
            if (log) {
                log.innerHTML = '<div class="log-entry">Начинаем бой с ботом! Сделайте ваш ход.</div>';
            }
            
            // Сбросить выбор
            resetChoices();
            
            // Показать экран боя
            showScreen('battle');
            
            showNotification('Бот найден! Приготовьтесь к бою!');
        }
    } catch (error) {
        console.error('Ошибка создания игры:', error);
        showNotification('Ошибка создания игры. Попробуйте снова.');
    }
}

// Сделать ход
async function makeChoice(choice) {
    if (!currentGame || !userData) return;
    
    // Визуальная обратная связь
    highlightChoice(choice);
    
    try {
        const response = await fetch(`/api/game/${currentGame.gameId}/choice`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: userData.id,
                choice: choice
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            
            // Обновить UI с выбором игрока
            document.getElementById('player1-choice').textContent = getChoiceEmoji(choice);
            
            // Если оба сделали ход, показать результат
            if (data.bothChoiced && data.result) {
                showBattleResult(data.result);
            } else {
                // Ждем ход бота
                addLogEntry('Ждем ход противника...');
                setTimeout(() => simulateBotChoice(data.game), 1000);
            }
        }
    } catch (error) {
        console.error('Ошибка хода:', error);
        showNotification('Ошибка хода. Попробуйте снова.');
    }
}

// Симулировать ход бота
function simulateBotChoice(game) {
    if (!game || !game.bot) return;
    
    // Получаем выбор бота из ответа сервера
    const botChoice = game.choices[game.bot.id];
    if (botChoice) {
        document.getElementById('player2-choice').textContent = getChoiceEmoji(botChoice);
        addLogEntry(`Бот выбрал: ${getChoiceName(botChoice)}`);
        
        // Показать результат через 1 секунду
        setTimeout(() => {
            fetchGameResult();
        }, 1000);
    }
}

// Получить результат игры
async function fetchGameResult() {
    if (!currentGame) return;
    
    try {
        const response = await fetch(`/api/game/${currentGame.gameId}/result`);
        if (response.ok) {
            const data = await response.json();
            if (data.game && data.game.result) {
                showBattleResult(data.game.result);
            }
        }
    } catch (error) {
        console.error('Ошибка получения результата:', error);
    }
}

// Показать результат боя
function showBattleResult(result) {
    if (!result) return;
    
    const player1Choice = result.player1Choice;
    const player2Choice = result.player2Choice;
    
    // Определить победителя
    let winner = '';
    let message = '';
    let reward = 0;
    
    if (result.isDraw) {
        winner = 'draw';
        message = 'Ничья!';
        reward = 1;
    } else if (result.winner === userData.id) {
        winner = 'player1';
        message = 'ПОБЕДА!';
        reward = selectedDifficulty === 'easy' ? 3 : 
                 selectedDifficulty === 'medium' ? 5 : 10;
    } else {
        winner = 'player2';
        message = 'ПОРАЖЕНИЕ';
        reward = 1;
    }
    
    // Обновить UI результата
    document.getElementById('result-title').textContent = message;
    document.getElementById('result-icon').textContent = winner === 'player1' ? '🏆' : 
                                                       winner === 'draw' ? '🤝' : '💔';
    document.getElementById('result-message').textContent = 
        winner === 'player1' ? 'Вы обыграли бота!' :
        winner === 'draw' ? 'Ничья! Попробуйте снова.' :
        'Бот оказался сильнее. Попробуйте снова!';
    
    document.getElementById('reward-amount').textContent = `+${reward} алмазов`;
    document.getElementById('your-choice').textContent = 
        `${getChoiceEmoji(player1Choice)} ${getChoiceName(player1Choice)}`;
    document.getElementById('enemy-choice').textContent = 
        `${getChoiceEmoji(player2Choice)} ${getChoiceName(player2Choice)}`;
    
    // Обновить статистику пользователя
    if (winner === 'player1') {
        userData.wins = (userData.wins || 0) + 1;
        userData.diamonds = (userData.diamonds || 0) + reward;
    } else if (winner === 'player2') {
        userData.losses = (userData.losses || 0) + 1;
        userData.diamonds = (userData.diamonds || 0) + reward;
    } else {
        userData.diamonds = (userData.diamonds || 0) + reward;
    }
    
    // Обновить UI
    updateUserUI();
    
    // Показать экран результата через 2 секунды
    setTimeout(() => {
        showScreen('result');
        stopBattleTimer();
    }, 2000);
}

// Вспомогательные функции для игры
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

function highlightChoice(choice) {
    // Сбросить все кнопки
    document.querySelectorAll('.choice-btn').forEach(btn => {
        btn.style.transform = 'scale(1)';
        btn.style.boxShadow = 'none';
    });
    
    // Подсветить выбранную кнопку
    const choiceBtn = document.querySelector(`.${choice}-btn`);
    if (choiceBtn) {
        choiceBtn.style.transform = 'scale(1.1)';
        choiceBtn.style.boxShadow = '0 0 20px rgba(255, 159, 67, 0.7)';
    }
}

function resetChoices() {
    document.getElementById('player1-choice').textContent = '❓';
    document.getElementById('player2-choice').textContent = '❓';
    
    document.querySelectorAll('.choice-btn').forEach(btn => {
        btn.style.transform = 'scale(1)';
        btn.style.boxShadow = 'none';
    });
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
            autoChoice();
        }
    }, 1000);
}

function stopBattleTimer() {
    if (gameTimer) {
        clearInterval(gameTimer);
        gameTimer = null;
    }
}

function autoChoice() {
    if (!currentGame) return;
    
    const choices = ['rock', 'paper', 'scissors'];
    const randomChoice = choices[Math.floor(Math.random() * choices.length)];
    makeChoice(randomChoice);
    addLogEntry('Время вышло! Сделан автоматический выбор.');
}

// Магазин
async function loadShopItems() {
    try {
        const response = await fetch('/api/skins');
        if (response.ok) {
            const data = await response.json();
            if (data.skins) {
                displayShopItems(data.skins);
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки скинов:', error);
    }
}

function displayShopItems(skins) {
    const container = document.getElementById('shop-items');
    if (!container) return;
    
    container.innerHTML = skins.map(skin => {
        const isOwned = userData.ownedSkins?.includes(skin.id) || skin.price === 0;
        const isEquipped = 
            (skin.type === 'rock' && userData.skinRock === skin.id) ||
            (skin.type === 'paper' && userData.skinPaper === skin.id) ||
            (skin.type === 'scissors' && userData.skinScissors === skin.id) ||
            (skin.type === 'all' && (
                userData.skinRock === skin.id ||
                userData.skinPaper === skin.id ||
                userData.skinScissors === skin.id
            ));
        
        return `
            <div class="shop-item ${isOwned ? 'owned' : ''} ${isEquipped ? 'equipped' : ''}">
                <div class="shop-item-icon">${skin.emoji}</div>
                <div class="shop-item-name">${skin.name}</div>
                <div class="shop-item-type">${getSkinTypeName(skin.type)}</div>
                <div class="shop-item-price">
                    <i class="fas fa-gem"></i> ${skin.price}
                </div>
                ${isOwned ? 
                    `<button class="equip-btn" onclick="equipSkin('${skin.id}', '${skin.type}')">
                        ${isEquipped ? 'Надето' : 'Надеть'}
                    </button>` :
                    `<button class="buy-btn" onclick="buySkin('${skin.id}', ${skin.price}, '${skin.type}')"
                     ${userData.diamonds < skin.price ? 'disabled' : ''}>
                        Купить
                    </button>`
                }
            </div>
        `;
    }).join('');
}

function getSkinTypeName(type) {
    const types = {
        'rock': 'Для камня',
        'paper': 'Для бумаги',
        'scissors': 'Для ножниц',
        'all': 'Для всех'
    };
    return types[type] || 'Особый';
}

async function buySkin(skinId, price, skinType) {
    if (userData.diamonds < price) {
        showNotification('Недостаточно алмазов!');
        return;
    }
    
    try {
        const response = await fetch(`/api/user/${userData.id}/buy-skin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                skinType: skinType,
                skinId: skinId,
                price: price
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            userData = data.user;
            updateUserUI();
            loadShopItems();
            showNotification(`Скин куплен! -${price} алмазов`);
        }
    } catch (error) {
        console.error('Ошибка покупки скина:', error);
        showNotification('Ошибка покупки. Попробуйте снова.');
    }
}

async function equipSkin(skinId, skinType) {
    try {
        const response = await fetch(`/api/user/${userData.id}/equip-skin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                skinType: skinType,
                skinId: skinId
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            userData = data.user;
            updateSkinsUI();
            loadShopItems();
            showNotification('Скин надет!');
        }
    } catch (error) {
        console.error('Ошибка смены скина:', error);
        showNotification('Ошибка смены скина.');
    }
}

function updateSkinsUI() {
    if (!userData) return;
    
    // Обновить скины на кнопках выбора
    document.getElementById('rock-skin').textContent = getSkinEmoji('rock');
    document.getElementById('paper-skin').textContent = getSkinEmoji('paper');
    document.getElementById('scissors-skin').textContent = getSkinEmoji('scissors');
    
    // Обновить текущие скины в коллекции
    document.getElementById('current-rock').textContent = getSkinEmoji('rock');
    document.getElementById('current-paper').textContent = getSkinEmoji('paper');
    document.getElementById('current-scissors').textContent = getSkinEmoji('scissors');
}

function getSkinEmoji(type) {
    if (!userData) return type === 'rock' ? '✊' : type === 'paper' ? '✋' : '✌️';
    
    const skinId = type === 'rock' ? userData.skinRock : 
                   type === 'paper' ? userData.skinPaper : userData.skinScissors;
    
    // Здесь можно добавить логику для разных скинов
    const skinEmojis = {
        'default': { rock: '✊', paper: '✋', scissors: '✌️' },
        'fire': { rock: '🔥', paper: '🔥', scissors: '🔥' },
        'ice': { rock: '❄️', paper: '❄️', scissors: '❄️' },
        'gold': { rock: '🥇', paper: '🥇', scissors: '🥇' }
    };
    
    return skinEmojis[skinId]?.[type] || skinEmojis.default[type];
}

// Коллекция
async function loadCollection() {
    updateSkinsUI();
}

function changeSkin(type) {
    showScreen('shop');
    // Здесь можно добавить логику для перехода к нужной вкладке
    setTimeout(() => {
        const tabBtn = document.querySelector(`.tab-btn[onclick*="${type}"]`);
        if (tabBtn) tabBtn.click();
    }, 100);
}

// Задания
async function loadTasks() {
    try {
        const response = await fetch(`/api/user/${userData.id}/tasks`);
        if (response.ok) {
            const data = await response.json();
            if (data.tasks) {
                displayTasks(data.tasks);
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки заданий:', error);
    }
    
    // Обновить реферальную информацию
    updateReferalInfo();
}

function displayTasks(tasks) {
    const container = document.getElementById('tasks-list');
    if (!container) return;
    
    container.innerHTML = tasks.map(task => `
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
            <button class="claim-btn" onclick="claimTask('${task.id}')" 
                    ${task.progress >= task.target ? '' : 'disabled'}>
                ${task.progress >= task.target ? 'Получить награду' : 'Не выполнено'}
            </button>
        </div>
    `).join('');
}

function updateReferalInfo() {
    if (!userData) return;
    
    document.getElementById('referal-count').textContent = userData.referals?.length || 0;
    document.getElementById('referal-earned').textContent = (userData.referals?.length || 0) * 50;
    
    // Обновить реферальную ссылку
    const referalLink = document.getElementById('referal-link');
    if (referalLink) {
        const baseUrl = window.location.origin;
        referalLink.value = `${baseUrl}/app?ref=${userData.referalCode}`;
    }
}

function copyReferalLink() {
    const input = document.getElementById('referal-link');
    input.select();
    document.execCommand('copy');
    showNotification('Ссылка скопирована в буфер обмена!');
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
    
    console.log('Уведомление:', text);
}

// Подсказки
function showHint() {
    const hintOverlay = document.getElementById('hint-overlay');
    if (hintOverlay) {
        hintOverlay.classList.remove('hidden');
    }
}

function closeHint() {
    const hintOverlay = document.getElementById('hint-overlay');
    if (hintOverlay) {
        hintOverlay.classList.add('hidden');
    }
}

// Поиск PvP (заглушка)
function startPvPSearch() {
    showScreen('pvp-search');
    
    let time = 15;
    const timerElement = document.getElementById('search-timer');
    
    if (searchTimer) clearInterval(searchTimer);
    
    searchTimer = setInterval(() => {
        time--;
        if (timerElement) {
            timerElement.textContent = time;
        }
        
        if (time <= 0) {
            cancelSearch();
            // В реальном приложении здесь будет переход к бою с найденным игроком
            showNotification('Противник не найден. Попробуйте снова.');
        }
    }, 1000);
}

function cancelSearch() {
    if (searchTimer) {
        clearInterval(searchTimer);
        searchTimer = null;
    }
    showScreen('main-menu');
}

// Настройки
function showSettings() {
    showScreen('settings');
}

// Дополнительные функции
function playAgain() {
    showScreen('difficulty');
}

function shareResult() {
    if (navigator.share) {
        navigator.share({
            title: 'Paper Win Rock',
            text: 'Я только что сыграл в крутую игру!',
            url: window.location.href
        });
    } else {
        showNotification('Скопируйте ссылку и поделитесь с друзьями!');
    }
}

function surrender() {
    if (confirm('Вы уверены, что хотите сдаться?')) {
        showNotification('Вы сдались. Попробуйте снова!');
        showScreen('main-menu');
        stopBattleTimer();
    }
}

// Экспорт для использования в HTML
window.showScreen = showScreen;
window.startBotGame = startBotGame;
window.makeChoice = makeChoice;
window.showHint = showHint;
window.closeHint = closeHint;
window.startPvPSearch = startPvPSearch;
window.cancelSearch = cancelSearch;
window.showSettings = showSettings;
window.changeSkin = changeSkin;
window.copyReferalLink = copyReferalLink;
window.playAgain = playAgain;
window.shareResult = shareResult;
window.surrender = surrender;

console.log('app.js загружен!');
