const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const path = require('path');
const fs = require('fs');

const token = '8365584044:AAESH0_vHwEhN9P05xgpJl8MPMNbbEpqRG0';
const webhookUrl = 'https://paper-win-rock.onrender.com';

const bot = new TelegramBot(token, { polling: false });
const app = express();

// ВАЖНО: Раздача статических файлов из папки public
app.use(express.static(path.join(__dirname, 'public')));

// Главная страница
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Paper Win Rock 🎮</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background: #2d3436;
                    color: white;
                    text-align: center;
                    padding: 50px;
                }
                h1 {
                    color: #ff9f43;
                    font-size: 48px;
                }
                .emoji {
                    font-size: 60px;
                    margin: 30px;
                }
                .btn {
                    display: inline-block;
                    background: #ff9f43;
                    color: white;
                    padding: 15px 30px;
                    border-radius: 25px;
                    text-decoration: none;
                    font-size: 20px;
                    margin: 20px;
                    transition: 0.3s;
                }
                .btn:hover {
                    background: #ff7f00;
                    transform: scale(1.05);
                }
                .status {
                    margin-top: 50px;
                    padding: 20px;
                    background: rgba(0, 184, 148, 0.2);
                    border-radius: 15px;
                    border: 2px solid #00b894;
                }
            </style>
        </head>
        <body>
            <div class="emoji">🎮</div>
            <h1>Paper Win Rock</h1>
            <p>Продвинутая игра в Telegram Mini App</p>
            <a href="/app" class="btn">🎮 Открыть игру</a>
            <a href="https://t.me/PaperWinRock_bot" class="btn">🤖 Перейти к боту</a>
            <div class="status">
                <p>✅ Сервер работает • 🤖 Бот активен • 🎮 Mini App готов</p>
                <p>🕒 Время сервера: ${new Date().toLocaleString('ru-RU')}</p>
            </div>
        </body>
        </html>
    `);
});

// Явный маршрут для /app (на всякий случай)
app.get('/app', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'index.html');
    
    // Проверяем существует ли файл
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            console.error(`Файл не найден: ${filePath}`);
            console.error(`Текущая директория: ${__dirname}`);
            console.error(`Содержимое public:`, fs.readdirSync(path.join(__dirname, 'public')));
            res.status(404).send('Файл index.html не найден');
            return;
        }
        
        console.log(`Отправляем файл: ${filePath}`);
        res.sendFile(filePath);
    });
});

// Вебхук от Telegram
app.post('/webhook', (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

// Health check для Render
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'paper-win-rock'
    });
});

// Команда /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const keyboard = {
        inline_keyboard: [[
            {
                text: '🎮 Открыть игру',
                web_app: { url: `${webhookUrl}/app` }
            }
        ]]
    };
    
    bot.sendMessage(chatId, 
        '🎮 Добро пожаловать в Paper Win Rock!\n\n' +
        'Новая версия с PvP боями, скинами и заданиями!\n\n' +
        'Нажми кнопку ниже, чтобы открыть игру:',
        { reply_markup: keyboard }
    );
});

// Запуск сервера - ВАЖНО: Используем только порт из переменной окружения
const PORT = process.env.PORT || 10000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🎮 Mini App: ${webhookUrl}/app`);
    console.log(`🏠 Главная: ${webhookUrl}/`);
    
    // Логируем структуру папок для отладки
    console.log(`Текущая директория: ${__dirname}`);
    try {
        const publicFiles = fs.readdirSync(path.join(__dirname, 'public'));
        console.log(`Файлы в public:`, publicFiles);
    } catch (err) {
        console.error(`Ошибка чтения папки public:`, err.message);
    }
});
