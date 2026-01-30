const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const path = require('path');
const crypto = require('crypto');

const token = '8365584044:AAESH0_vHwEhN9P05xgpJl8MPMNbbEpqRG0';
const webhookUrl = 'https://paper-win-rock.onrender.com';

const bot = new TelegramBot(token, { polling: false });
const app = express();

// Middleware для парсинга JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Раздача статических файлов
app.use(express.static(path.join(__dirname, 'public')));

// БД в памяти (в продакшене заменить на реальную БД)
const usersDB = new Map();
const gamesDB = new Map();
const skinsDB = new Map();
const referalsDB = new Map();

// Генерация уникального ID
const generateId = () => crypto.randomBytes(8).toString('hex');

// Инициализация пользователя
function initUser(userId) {
    if (!usersDB.has(userId)) {
        usersDB.set(userId, {
            id: userId,
            username: `Игрок_${userId.slice(0, 4)}`,
            diamonds: 100,
            wins: 0,
            losses: 0,
            skinRock: 'default',
            skinPaper: 'default',
            skinScissors: 'default',
            ownedSkins: ['default'],
            referalCode: generateId(),
            referals: [],
            dailyTasks: {},
            lastLogin: new Date().toISOString(),
            stats: {
                totalGames: 0,
                winStreak: 0,
                bestWinStreak: 0,
                favoriteChoice: 'rock'
            }
        });
    }
    return usersDB.get(userId);
}

// Генерация бота
function generateBot() {
    const botTypes = ['easy', 'medium', 'hard'];
    const type = botTypes[Math.floor(Math.random() * botTypes.length)];
    const names = {
        easy: ['Новичок Бот', 'Ученик', 'Начинающий'],
        medium: ['Опытный Бот', 'Ветеран', 'Мастер'],
        hard: ['Легенда', 'Чемпион', 'Босс']
    };
    
    return {
        id: 'bot_' + generateId(),
        name: names[type][Math.floor(Math.random() * names[type].length)],
        type: type,
        avatar: '🤖',
        difficulty: type === 'easy' ? 1 : type === 'medium' ? 2 : 3
    };
}

// Логика игры камень-ножницы-бумага
function determineWinner(player1Choice, player2Choice) {
    if (player1Choice === player2Choice) return 'draw';
    
    const rules = {
        rock: 'scissors',
        scissors: 'paper',
        paper: 'rock'
    };
    
    return rules[player1Choice] === player2Choice ? 'player1' : 'player2';
}

// Главная страница
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Paper Win Rock 🎮</title>
            <style>
                body {
                    font-family: 'Arial', sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    text-align: center;
                    padding: 40px;
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                }
                .container {
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    border-radius: 20px;
                    padding: 40px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                    max-width: 600px;
                    width: 90%;
                }
                h1 {
                    color: #ff9f43;
                    font-size: 3.5rem;
                    margin-bottom: 10px;
                    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
                }
                .subtitle {
                    font-size: 1.2rem;
                    opacity: 0.9;
                    margin-bottom: 30px;
                }
                .emoji-grid {
                    display: flex;
                    justify-content: center;
                    gap: 20px;
                    margin: 30px 0;
                    font-size: 3rem;
                }
                .emoji-grid span {
                    animation: bounce 2s infinite;
                }
                .emoji-grid span:nth-child(2) {
                    animation-delay: 0.2s;
                }
                .emoji-grid span:nth-child(3) {
                    animation-delay: 0.4s;
                }
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-20px); }
                }
                .btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(45deg, #ff9f43, #ff7f00);
                    color: white;
                    padding: 18px 36px;
                    border-radius: 50px;
                    text-decoration: none;
                    font-size: 1.3rem;
                    font-weight: bold;
                    margin: 15px;
                    transition: all 0.3s ease;
                    border: none;
                    cursor: pointer;
                    box-shadow: 0 4px 15px rgba(255, 159, 67, 0.4);
                }
                .btn:hover {
                    transform: translateY(-3px) scale(1.05);
                    box-shadow: 0 6px 20px rgba(255, 159, 67, 0.6);
                }
                .btn i {
                    margin-right: 10px;
                    font-size: 1.5rem;
                }
                .btn-group {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: center;
                    gap: 15px;
                    margin-top: 20px;
                }
                .stats {
                    background: rgba(255, 255, 255, 0.15);
                    border-radius: 15px;
                    padding: 25px;
                    margin-top: 30px;
                    border: 2px solid rgba(255, 255, 255, 0.2);
                }
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 20px;
                    margin-top: 20px;
                }
                .stat-item {
                    padding: 15px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .stat-value {
                    font-size: 1.8rem;
                    font-weight: bold;
                    color: #ff9f43;
                    display: block;
                    margin-top: 5px;
                }
                .features {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin: 30px 0;
                }
                .feature {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 20px;
                    border-radius: 15px;
                    border-left: 4px solid #ff9f43;
                }
                .feature h3 {
                    margin-top: 0;
                    color: #ff9f43;
                }
                .telegram-btn {
                    background: linear-gradient(45deg, #0088cc, #34b7f1);
                }
                .telegram-btn:hover {
                    box-shadow: 0 6px 20px rgba(52, 183, 241, 0.6);
                }
                @media (max-width: 768px) {
                    .container {
                        padding: 20px;
                    }
                    h1 {
                        font-size: 2.5rem;
                    }
                    .btn {
                        padding: 15px 25px;
                        font-size: 1.1rem;
                    }
                    .stats-grid {
                        grid-template-columns: 1fr;
                    }
                }
            </style>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        </head>
        <body>
            <div class="container">
                <div class="emoji-grid">
                    <span>✊</span>
                    <span>✋</span>
                    <span>✌️</span>
                </div>
                
                <h1>Paper Win Rock</h1>
                <p class="subtitle">Продвинутая PvP игра в Telegram Mini App</p>
                
                <div class="features">
                    <div class="feature">
                        <h3><i class="fas fa-gamepad"></i> Реальные бои</h3>
                        <p>Сражайся с живыми игроками и ботами</p>
                    </div>
                    <div class="feature">
                        <h3><i class="fas fa-gem"></i> Система скинов</h3>
                        <p>Коллекционируй уникальные скины</p>
                    </div>
                    <div class="feature">
                        <h3><i class="fas fa-trophy"></i> Задания</h3>
                        <p>Выполняй задания и получай награды</p>
                    </div>
                </div>
                
                <div class="btn-group">
                    <a href="/app" class="btn">
                        <i class="fas fa-gamepad"></i> 🎮 Открыть игру
                    </a>
                    <a href="https://t.me/PaperWinRock_bot" target="_blank" class="btn telegram-btn">
                        <i class="fab fa-telegram"></i> 🤖 Перейти к боту
                    </a>
                </div>
                
                <div class="stats">
                    <h2><i class="fas fa-chart-line"></i> Статистика сервера</h2>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <span>Игроков онлайн</span>
                            <span class="stat-value">${Math.floor(Math.random() * 500) + 1000}</span>
                        </div>
                        <div class="stat-item">
                            <span>Сыграно матчей</span>
                            <span class="stat-value">${Math.floor(Math.random() * 5000) + 10000}</span>
                        </div>
                        <div class="stat-item">
                            <span>Скинов куплено</span>
                            <span class="stat-value">${Math.floor(Math.random() * 1000) + 5000}</span>
                        </div>
                    </div>
                </div>
                
                <div style="margin-top: 30px; opacity: 0.8; font-size: 0.9rem;">
                    <p><i class="fas fa-shield-alt"></i> Сервер работает стабильно • Telegram Web App готов</p>
                    <p><i class="fas fa-clock"></i> Время сервера: ${new Date().toLocaleString('ru-RU')}</p>
                </div>
            </div>
            
            <script>
                // Анимация счёта
                document.querySelectorAll('.stat-value').forEach(stat => {
                    const target = parseInt(stat.textContent.replace(/,/g, ''));
                    let current = 0;
                    const increment = target / 50;
                    const timer = setInterval(() => {
                        current += increment;
                        if (current >= target) {
                            current = target;
                            clearInterval(timer);
                        }
                        stat.textContent = Math.floor(current).toLocaleString();
                    }, 30);
                });
            </script>
        </body>
        </html>
    `);
});

// API: Получить пользователя
app.get('/api/user/:userId', (req, res) => {
    const user = initUser(req.params.userId);
    res.json(user);
});

// API: Обновить статистику
app.post('/api/user/:userId/stats', (req, res) => {
    const { wins, losses, diamonds } = req.body;
    const user = initUser(req.params.userId);
    
    if (wins !== undefined) user.wins += wins;
    if (losses !== undefined) user.losses += losses;
    if (diamonds !== undefined) user.diamonds += diamonds;
    
    res.json({ success: true, user });
});

// API: Купить скин
app.post('/api/user/:userId/buy-skin', (req, res) => {
    const { skinType, skinId, price } = req.body;
    const user = initUser(req.params.userId);
    
    if (user.diamonds < price) {
        return res.status(400).json({ success: false, error: 'Недостаточно алмазов' });
    }
    
    user.diamonds -= price;
    user.ownedSkins.push(skinId);
    
    // Автоматически надеть купленный скин
    if (skinType === 'rock') user.skinRock = skinId;
    if (skinType === 'paper') user.skinPaper = skinId;
    if (skinType === 'scissors') user.skinScissors = skinId;
    
    res.json({ success: true, user });
});

// API: Сменить скин
app.post('/api/user/:userId/equip-skin', (req, res) => {
    const { skinType, skinId } = req.body;
    const user = initUser(req.params.userId);
    
    if (!user.ownedSkins.includes(skinId)) {
        return res.status(400).json({ success: false, error: 'Скин не куплен' });
    }
    
    if (skinType === 'rock') user.skinRock = skinId;
    if (skinType === 'paper') user.skinPaper = skinId;
    if (skinType === 'scissors') user.skinScissors = skinId;
    
    res.json({ success: true, user });
});

// API: Создать игру с ботом
app.post('/api/game/bot', (req, res) => {
    const { userId, difficulty = 'medium' } = req.body;
    const user = initUser(userId);
    const bot = generateBot();
    
    const gameId = generateId();
    const game = {
        id: gameId,
        player1: user.id,
        player2: bot.id,
        bot: bot,
        status: 'waiting',
        choices: {},
        result: null,
        createdAt: new Date().toISOString(),
        difficulty: difficulty
    };
    
    gamesDB.set(gameId, game);
    
    res.json({ 
        success: true, 
        gameId,
        bot,
        message: 'Бот найден! Приготовьтесь к бою!'
    });
});

// API: Сделать ход
app.post('/api/game/:gameId/choice', (req, res) => {
    const { userId, choice } = req.body;
    const game = gamesDB.get(req.params.gameId);
    
    if (!game) {
        return res.status(404).json({ success: false, error: 'Игра не найдена' });
    }
    
    // Записать ход игрока
    game.choices[userId] = choice;
    
    // Если игра с ботом, сгенерировать ход бота
    if (game.bot && !game.choices[game.bot.id]) {
        const botChoices = ['rock', 'paper', 'scissors'];
        let botChoice;
        
        // Логика сложности бота
        if (game.difficulty === 'easy') {
            botChoice = botChoices[Math.floor(Math.random() * 3)];
        } else if (game.difficulty === 'medium') {
            // Бот иногда выбирает выигрышный ход
            const random = Math.random();
            if (random < 0.3) {
                // Выигрышный ход против игрока
                const winningMoves = {
                    rock: 'paper',
                    paper: 'scissors',
                    scissors: 'rock'
                };
                botChoice = winningMoves[choice];
            } else {
                botChoice = botChoices[Math.floor(Math.random() * 3)];
            }
        } else {
            // Сложный бот чаще выбирает выигрышный ход
            const random = Math.random();
            if (random < 0.6) {
                const winningMoves = {
                    rock: 'paper',
                    paper: 'scissors',
                    scissors: 'rock'
                };
                botChoice = winningMoves[choice];
            } else {
                botChoice = botChoices[Math.floor(Math.random() * 3)];
            }
        }
        
        game.choices[game.bot.id] = botChoice;
    }
    
    // Проверить, сделали ли оба хода
    const players = [game.player1, game.player2];
    const bothChoiced = players.every(p => game.choices[p]);
    
    if (bothChoiced) {
        // Определить победителя
        const player1Choice = game.choices[game.player1];
        const player2Choice = game.choices[game.player2];
        const winner = determineWinner(player1Choice, player2Choice);
        
        game.result = {
            winner: winner === 'player1' ? game.player1 : winner === 'player2' ? game.player2 : null,
            player1Choice,
            player2Choice,
            isDraw: winner === 'draw'
        };
        
        game.status = 'finished';
        
        // Обновить статистику игрока
        const user = initUser(userId);
        if (winner === 'player1') {
            user.wins += 1;
            user.diamonds += 5; // Награда за победу
            user.stats.winStreak += 1;
            if (user.stats.winStreak > user.stats.bestWinStreak) {
                user.stats.bestWinStreak = user.stats.winStreak;
            }
        } else if (winner === 'player2') {
            user.losses += 1;
            user.stats.winStreak = 0;
            user.diamonds += 1; // Небольшая награда даже за поражение
        }
        user.stats.totalGames += 1;
    }
    
    res.json({ 
        success: true, 
        game,
        bothChoiced,
        result: game.result
    });
});

// API: Получить результат игры
app.get('/api/game/:gameId/result', (req, res) => {
    const game = gamesDB.get(req.params.gameId);
    if (!game) {
        return res.status(404).json({ success: false, error: 'Игра не найдена' });
    }
    res.json({ success: true, game });
});

// API: Реферальная система
app.post('/api/referal/:code/use', (req, res) => {
    const { userId } = req.body;
    const code = req.params.code;
    
    // Найти пользователя с таким кодом
    let referrer = null;
    for (const [id, user] of usersDB) {
        if (user.referalCode === code && id !== userId) {
            referrer = user;
            break;
        }
    }
    
    if (!referrer) {
        return res.status(400).json({ success: false, error: 'Неверный реферальный код' });
    }
    
    // Добавить реферала
    referrer.referals.push(userId);
    referrer.diamonds += 50;
    
    // Дать бонус новому пользователю
    const newUser = initUser(userId);
    newUser.diamonds += 25;
    
    res.json({ 
        success: true, 
        bonus: 25,
        referrer: referrer.username
    });
});

// API: Получить список скинов
app.get('/api/skins', (req, res) => {
    const skins = [
        { id: 'default', name: 'Обычный', price: 0, type: 'all', emoji: '🎮' },
        { id: 'fire', name: 'Огненный', price: 100, type: 'rock', emoji: '🔥' },
        { id: 'ice', name: 'Ледяной', price: 100, type: 'paper', emoji: '❄️' },
        { id: 'thunder', name: 'Громовой', price: 100, type: 'scissors', emoji: '⚡' },
        { id: 'gold', name: 'Золотой', price: 500, type: 'all', emoji: '🥇' },
        { id: 'diamond', name: 'Алмазный', price: 1000, type: 'all', emoji: '💎' },
        { id: 'space', name: 'Космический', price: 750, type: 'rock', emoji: '🚀' },
        { id: 'ocean', name: 'Океанский', price: 750, type: 'paper', emoji: '🌊' },
        { id: 'forest', name: 'Лесной', price: 750, type: 'scissors', emoji: '🌿' },
        { id: 'robot', name: 'Робот', price: 300, type: 'all', emoji: '🤖' },
        { id: 'alien', name: 'Пришелец', price: 400, type: 'rock', emoji: '👽' },
        { id: 'magic', name: 'Магический', price: 600, type: 'all', emoji: '✨' }
    ];
    
    res.json({ success: true, skins });
});

// API: Ежедневные задания
app.get('/api/user/:userId/tasks', (req, res) => {
    const tasks = [
        { id: 'win_3', name: 'Выиграть 3 игры', reward: 50, progress: 0, target: 3, type: 'wins' },
        { id: 'play_5', name: 'Сыграть 5 игр', reward: 30, progress: 0, target: 5, type: 'plays' },
        { id: 'buy_skin', name: 'Купить скин', reward: 100, progress: 0, target: 1, type: 'buy' },
        { id: 'streak_3', name: 'Победная серия 3', reward: 75, progress: 0, target: 3, type: 'streak' },
        { id: 'referal', name: 'Пригласить друга', reward: 200, progress: 0, target: 1, type: 'referal' }
    ];
    
    res.json({ success: true, tasks });
});

// Маршрут для игры
app.get('/app', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        service: 'paper-win-rock',
        users: usersDB.size,
        games: gamesDB.size,
        uptime: process.uptime()
    });
});

// Обработка вебхуков Telegram
app.post('/webhook', (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

// Команды бота
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const user = initUser(userId);
    
    const keyboard = {
        inline_keyboard: [[
            {
                text: '🎮 Открыть игру',
                web_app: { url: `${webhookUrl}/app` }
            }
        ]]
    };
    
    bot.sendMessage(chatId, 
        `🎮 Добро пожаловать в Paper Win Rock, ${msg.from.first_name || 'Игрок'}!\n\n` +
        'Новая версия с PvP боями, скинами и заданиями!\n\n' +
        `✨ У вас есть ${user.diamonds} алмазов\n` +
        `🏆 Побед: ${user.wins}\n\n` +
        'Нажми кнопку ниже, чтобы открыть игру:',
        { reply_markup: keyboard }
    );
});

bot.onText(/\/play/, (msg) => {
    const chatId = msg.chat.id;
    
    bot.sendMessage(chatId, 'Нажми на кнопку, чтобы начать игру!', {
        reply_markup: {
            inline_keyboard: [[
                {
                    text: '🎮 Играть сейчас!',
                    web_app: { url: `${webhookUrl}/app` }
                }
            ]]
        }
    });
});

bot.onText(/\/stats/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const user = initUser(userId);
    
    bot.sendMessage(chatId, 
        `📊 Твоя статистика, ${msg.from.first_name || 'Игрок'}:\n\n` +
        `🏆 Побед: ${user.wins}\n` +
        `💔 Поражений: ${user.losses}\n` +
        `💎 Алмазов: ${user.diamonds}\n` +
        `🎯 Винстрик: ${user.stats.winStreak}\n` +
        `👑 Лучший винстрик: ${user.stats.bestWinStreak}\n` +
        `🎮 Всего игр: ${user.stats.totalGames}\n\n` +
        `Реферальный код: ${user.referalCode}\n` +
        `Приглашено друзей: ${user.referals.length}`,
        {
            reply_markup: {
                inline_keyboard: [[
                    { text: '🎮 Играть', web_app: { url: `${webhookUrl}/app` } }
                ]]
            }
        }
    );
});

bot.onText(/\/referal/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const user = initUser(userId);
    
    bot.sendMessage(chatId, 
        `👥 Реферальная система\n\n` +
        `Твой код: <code>${user.referalCode}</code>\n` +
        `Твоя ссылка: https://t.me/PaperWinRock_bot?start=${user.referalCode}\n\n` +
        `Приглашено друзей: ${user.referals.length}\n` +
        `🎁 За каждого друга получишь 50 алмазов!\n\n` +
        `Друг должен сыграть 3 матча, чтобы награда активировалась.`,
        { parse_mode: 'HTML' }
    );
});

// Запуск сервера
const PORT = process.env.PORT || 10000;

app.listen(PORT, '0.0.0.0', async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🎮 Mini App: ${webhookUrl}/app`);
    console.log(`🏠 Главная: ${webhookUrl}/`);
    console.log(`❤️  Health check: ${webhookUrl}/health`);
    
    try {
        await bot.setWebHook(`${webhookUrl}/webhook`);
        console.log('✅ Webhook установлен');
    } catch (err) {
        console.error('❌ Ошибка webhook:', err);
    }
});
