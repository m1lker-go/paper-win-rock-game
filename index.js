const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const path = require('path');
const fs = require('fs');

const token = '8365584044:AAESH0_vHwEhN9P05xgpJl8MPMNbbEpqRG0';
const webhookUrl = 'https://paper-win-rock.onrender.com';

const bot = new TelegramBot(token, { polling: false });
const app = express();

// ДИАГНОСТИКА: Показываем структуру проекта при запуске
console.log('=== НАЧАЛО ДИАГНОСТИКИ ===');
console.log('Текущая директория:', __dirname);
console.log('Содержимое корневой директории:');
try {
    const rootFiles = fs.readdirSync(__dirname);
    console.log(rootFiles);
} catch (err) {
    console.error('Ошибка чтения корневой директории:', err.message);
}

console.log('\nПроверяем существование папки public:');
const publicPath = path.join(__dirname, 'public');
console.log('Путь к public:', publicPath);
console.log('Папка public существует?', fs.existsSync(publicPath));

if (fs.existsSync(publicPath)) {
    console.log('Содержимое public:');
    const publicFiles = fs.readdirSync(publicPath);
    console.log(publicFiles);
}

console.log('=== КОНЕЦ ДИАГНОСТИКИ ===\n');

// ВАЖНО: Раздача статических файлов из папки public
app.use(express.static(publicPath));

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
    
    console.log(`\n=== ЗАПРОС К /app ===`);
    console.log('Ищем файл по пути:', filePath);
    console.log('Файл существует?', fs.existsSync(filePath));
    
    if (!fs.existsSync(filePath)) {
        // Пробуем альтернативные пути
        console.log('Пробуем альтернативные пути...');
        const altPaths = [
            path.join(__dirname, 'public', 'index.html'),
            path.join(process.cwd(), 'public', 'index.html'),
            '/opt/render/project/src/public/index.html',
            '/opt/render/project/public/index.html'
        ];
        
        for (const altPath of altPaths) {
            console.log(`Проверяем: ${altPath} - ${fs.existsSync(altPath) ? 'СУЩЕСТВУЕТ' : 'не существует'}`);
            if (fs.existsSync(altPath)) {
                console.log(`Отправляем файл: ${altPath}`);
                return res.sendFile(altPath);
            }
        }
        
        console.log('Файл index.html не найден ни по одному из путей');
        return res.status(404).send('Файл index.html не найден. Проверьте логи на Render.');
    }
    
    console.log(`Отправляем файл: ${filePath}`);
    res.sendFile(filePath);
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

// Запуск сервера
const PORT = process.env.PORT || 10000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🎮 Mini App: ${webhookUrl}/app`);
    console.log(`🏠 Главная: ${webhookUrl}/`);
    console.log(`📁 Текущая рабочая директория: ${process.cwd()}`);
});
