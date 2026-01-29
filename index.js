const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const path = require('path');
const axios = require('axios');

const token = '8365584044:AAESH0_vHwEhN9P05xgpJl8MPMNbbEpqRG0';
const webhookUrl = 'https://paper-win-rock.onrender.com';

const bot = new TelegramBot(token, { polling: false });
const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// База данных в памяти (для демо)
const userDatabase = new Map();
const matchmakingQueue = [];
const activeBattles = new Map();

// Главная страница
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API для обработки реферальных ссылок
app.get('/ref/:code', (req, res) => {
    const referalCode = req.params.code;
    // Здесь можно добавить логику обработки рефералов
    res.redirect(`https://t.me/PaperWinRock_bot?start=ref_${referalCode}`);
});

// API для получения информации о пользователе
app.get('/api/user/:userId', (req, res) => {
    const userId = req.params.userId;
    const userData = userDatabase.get(userId) || {
        id: userId,
        diamonds: 100,
        wins: 0,
        losses: 0,
        referals: []
    };
    
    res.json(userData);
});

// API для поиска соперника
app.post('/api/matchmaking', (req, res) => {
    const { userId } = req.body;
    
    // Добавляем пользователя в очередь
    if (!matchmakingQueue.includes(userId)) {
        matchmakingQueue.push(userId);
    }
    
    // Ищем соперника
    if (matchmakingQueue.length >= 2) {
        const player1 = matchmakingQueue.shift();
        const player2 = matchmakingQueue.shift();
        
        // Создаем битву
        const battleId = Date.now().toString();
        activeBattles.set(battleId, {
            players: [player1, player2],
            choices: {},
            status: 'waiting'
        });
        
        res.json({
            success: true,
            battleId,
            opponentFound: true,
            opponent: player1 === userId ? player2 : player1
        });
    } else {
        res.json({
            success: true,
            opponentFound: false,
            queuePosition: matchmakingQueue.length
        });
    }
});

// API для отмены поиска
app.post('/api/cancel-search', (req, res) => {
    const { userId } = req.body;
    
    const index = matchmakingQueue.indexOf(userId);
    if (index !== -1) {
        matchmakingQueue.splice(index, 1);
    }
    
    res.json({ success: true });
});

// Вебхук от Telegram
app.post('/webhook', (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

// Обработка команды /start с реферальным кодом
bot.onText(/\/start(?: ref_(\w+))?/, (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const referalCode = match[1];
    
    // Сохраняем пользователя в базу
    if (!userDatabase.has(userId)) {
        userDatabase.set(userId, {
            id: userId,
            username: msg.from.first_name || 'Игрок',
            diamonds: 100,
            wins: 0,
            losses: 0,
            referals: [],
            referalCode: generateReferalCode(userId),
            joinDate: new Date().toISOString()
        });
        
        // Обработка реферального кода
        if (referalCode) {
            // Находим реферера
            for (const [refId, userData] of userDatabase) {
                if (userData.referalCode === referalCode) {
                    // Добавляем реферала
                    userData.referals.push({
                        userId: userId,
                        date: new Date().toISOString(),
                        matchesPlayed: 0,
                        rewardGiven: false
                    });
                    
                    // Отправляем уведомление рефереру
                    bot.sendMessage(refId, 
                        `🎉 Новый реферал!\n` +
                        `К вам присоединился новый игрок: ${msg.from.first_name || 'Игрок'}\n` +
                        `Вы получите алмазы после того, как он сыграет 3 матча!`
                    );
                    break;
                }
            }
        }
    }
    
    // Отправляем приветственное сообщение
    const userData = userDatabase.get(userId);
    const keyboard = {
        inline_keyboard: [[
            {
                text: '🎮 Открыть игру',
                web_app: { url: `${webhookUrl}/app` }
            }
        ]]
    };
    
    bot.sendMessage(chatId,
        `👋 Добро пожаловать в Paper Win Rock, ${userData.username}!\n\n` +
        `🎮 <b>Новая версия игры с:</b>\n` +
        `• PvP боями с реальными игроками\n` +
        `• Системой скинов для рук\n` +
        `• Магазином и заданиями\n` +
        `• Реферальной системой\n\n` +
        `✨ <b>Ваши алмазы:</b> ${userData.diamonds}\n` +
        `🏆 <b>Побед/Поражений:</b> ${userData.wins}/${userData.losses}\n\n` +
        `Нажми кнопку ниже, чтобы открыть игру!`,
        {
            parse_mode: 'HTML',
            reply_markup: keyboard
        }
    );
});

// Генерация реферального кода
function generateReferalCode(userId) {
    return 'REF' + userId.slice(-5) + Math.random().toString(36).substr(2, 3).toUpperCase();
}

// Настройка кнопки меню при запуске
async function setupMenuButton() {
    try {
        await bot.setChatMenuButton({
            menu_button: {
                type: 'web_app',
                text: '🎮 Играть',
                web_app: {
                    url: `${webhookUrl}/app`
                }
            }
        });
        console.log('✅ Menu button configured');
    } catch (error) {
        console.log('⚠️ Menu button not configured');
    }
}

// Запуск сервера
const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🎮 Game URL: ${webhookUrl}/app`);
    
    // Установка вебхука
    try {
        await bot.setWebHook(`${webhookUrl}/webhook`);
        console.log('✅ Webhook set');
    } catch (error) {
        console.log('❌ Webhook error:', error.message);
    }
    
    // Настройка кнопки меню
    await setupMenuButton();
    
    console.log('\n📱 Game is ready! Players can start playing.');
});
