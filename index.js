const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const path = require('path');
const axios = require('axios');

// Токен бота
const token = '8365584044:AAESH0_vHwEhN9P05xgpJl8MPMNbbEpqRG0';
const webhookUrl = 'https://paper-win-rock.onrender.com';

// Инициализация бота и Express
const bot = new TelegramBot(token, { polling: false });
const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ================== РОУТЫ ==================

// Главная страница для проверки
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Бумага vs Камень 🎮</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    text-align: center;
                    padding: 50px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background: rgba(255, 255, 255, 0.1);
                    padding: 30px;
                    border-radius: 20px;
                    backdrop-filter: blur(10px);
                }
                h1 {
                    font-size: 36px;
                    margin-bottom: 20px;
                }
                .emoji {
                    font-size: 48px;
                    margin: 10px;
                }
                .links {
                    margin-top: 30px;
                }
                a {
                    display: block;
                    margin: 15px auto;
                    padding: 15px 30px;
                    background: rgba(255, 255, 255, 0.2);
                    color: white;
                    text-decoration: none;
                    border-radius: 25px;
                    max-width: 300px;
                    transition: all 0.3s;
                }
                a:hover {
                    background: rgba(255, 255, 255, 0.3);
                    transform: translateY(-3px);
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="emoji">🎮 ✊ ✋ ✌️</div>
                <h1>Бумага побеждает Камень</h1>
                <p>Телеграм бот с Mini App игрой</p>
                
                <div class="links">
                    <a href="/app" target="_blank">🎮 Открыть Mini App</a>
                    <a href="https://t.me/${bot.options.username}" target="_blank">🤖 Перейти к боту</a>
                    <a href="https://api.telegram.org/bot${token}/getWebhookInfo" target="_blank">🔧 Проверить вебхук</a>
                </div>
                
                <div style="margin-top: 40px; font-size: 14px; opacity: 0.8;">
                    <p>Bot is running on Render! 🚀</p>
                    <p>Webhook URL: ${webhookUrl}/webhook</p>
                    <p>Mini App URL: ${webhookUrl}/app</p>
                </div>
            </div>
        </body>
        </html>
    `);
});

// Страница Mini App
app.get('/app', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API для установки вебхука вручную
app.get('/set-webhook', async (req, res) => {
    try {
        const result = await bot.setWebHook(`${webhookUrl}/webhook`);
        res.json({ 
            success: true, 
            message: 'Webhook установлен!',
            url: `${webhookUrl}/webhook`,
            result: result 
        });
    } catch (error) {
        res.json({ 
            success: false, 
            error: error.message 
        });
    }
});

// API для установки кнопки меню
app.get('/set-menu-button', async (req, res) => {
    try {
        const response = await axios.post(
            `https://api.telegram.org/bot${token}/setChatMenuButton`,
            {
                menu_button: {
                    type: 'web_app',
                    text: '🎮 Играть',
                    web_app: {
                        url: `${webhookUrl}/app`
                    }
                }
            }
        );
        res.json({ 
            success: true, 
            message: 'Кнопка меню установлена!',
            data: response.data 
        });
    } catch (error) {
        res.json({ 
            success: false, 
            error: error.message,
            details: error.response?.data 
        });
    }
});

// API для получения информации о боте
app.get('/bot-info', async (req, res) => {
    try {
        const webhook = await bot.getWebHookInfo();
        const botInfo = await bot.getMe();
        
        res.json({
            success: true,
            bot: {
                id: botInfo.id,
                username: botInfo.username,
                first_name: botInfo.first_name
            },
            webhook: {
                url: webhook.url,
                pending_updates: webhook.pending_update_count
            },
            urls: {
                webhook: `${webhookUrl}/webhook`,
                app: `${webhookUrl}/app`
            }
        });
    } catch (error) {
        res.json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Вебхук от Telegram (ВАЖНО: должен быть POST запрос)
app.post('/webhook', (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

// Страница здоровья для Render
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        service: 'telegram-bot-mini-app'
    });
});

// ================== НАСТРОЙКА КНОПКИ МЕНЮ ==================

async function setupMenuButton() {
    try {
        console.log('🔄 Настраиваю кнопку меню для Mini App...');
        
        const response = await axios.post(
            `https://api.telegram.org/bot${token}/setChatMenuButton`,
            {
                menu_button: {
                    type: 'web_app',
                    text: '🎮 Играть',
                    web_app: {
                        url: `${webhookUrl}/app`
                    }
                }
            }
        );
        
        if (response.data.ok) {
            console.log('✅ Кнопка меню успешно настроена!');
            console.log('🎮 Теперь в меню бота появится кнопка "🎮 Играть"');
        } else {
            console.log('⚠️ Не удалось настроить кнопку меню, но Mini App всё равно доступен');
        }
    } catch (error) {
        console.log('⚠️ Кнопка меню не настроена (не критично)');
        console.log('📱 Mini App доступен по команде /start или прямой ссылке');
    }
}

// ================== КОМАНДЫ БОТА ==================

// Команда /start - главное меню с Mini App
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const username = msg.from?.first_name || 'Игрок';
    
    const keyboard = {
        inline_keyboard: [
            [{
                text: '🎮 Открыть Mini App',
                web_app: { url: `${webhookUrl}/app` }
            }],
            [{
                text: '🎮 Быстрая игра в чате',
                callback_data: 'quick_play'
            }],
            [{
                text: '📊 Статистика',
                callback_data: 'stats'
            }]
        ]
    };
    
    bot.sendMessage(chatId, 
        `👋 Привет, ${username}!\n\n` +
        `🎮 Добро пожаловать в игру "Бумага побеждает Камень"!\n\n` +
        `✨ <b>Новая функция:</b> Полноценный Mini App с красивым интерфейсом!\n\n` +
        `🎯 <b>Как играть:</b>\n` +
        `• Нажми "🎮 Открыть Mini App" для полной версии\n` +
        `• Или выбери "Быстрая игра" для игры в чате\n` +
        `• Или просто пришли мне ✊, ✋ или ✌️\n\n` +
        `<i>Бумага 📄 побеждает камень 🪨\n` +
        `Камень 🪨 побеждает ножницы ✂️\n` +
        `Ножницы ✂️ побеждают бумагу 📄</i>`,
        {
            parse_mode: 'HTML',
            reply_markup: keyboard
        }
    );
});

// Команда /play - быстрая игра в чате
bot.onText(/\/play/, (msg) => {
    const chatId = msg.chat.id;
    
    const keyboard = {
        reply_markup: {
            keyboard: [
                ['✊ Камень', '✋ Бумага', '✌️ Ножницы'],
                ['🎮 Открыть Mini App', '📊 Статистика']
            ],
            resize_keyboard: true,
            one_time_keyboard: false
        }
    };
    
    bot.sendMessage(chatId, 
        '🎮 <b>Быстрая игра</b>\n\n' +
        'Выбери свой ход на клавиатуре ниже:\n' +
        '• ✊ Камень\n' +
        '• ✋ Бумага\n' +
        '• ✌️ Ножницы\n\n' +
        'Или нажми "🎮 Открыть Mini App" для полной версии!',
        {
            parse_mode: 'HTML',
            ...keyboard
        }
    );
});

// Команда /help - помощь
bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    
    bot.sendMessage(chatId,
        '🆘 <b>Помощь по игре "Бумага побеждает Камень"</b>\n\n' +
        '🎮 <b>Доступные команды:</b>\n' +
        '/start - Главное меню с Mini App\n' +
        '/play - Быстрая игра в чате\n' +
        '/help - Эта справка\n\n' +
        '🎯 <b>Как играть:</b>\n' +
        '1. Выбери ✊, ✋ или ✌️\n' +
        '2. Бот тоже сделает выбор\n' +
        '3. Определится победитель!\n\n' +
        '📖 <b>Правила:</b>\n' +
        '• 📄 Бумага побеждает камень 🪨\n' +
        '• 🪨 Камень побеждает ножницы ✂️\n' +
        '• ✂️ Ножницы побеждают бумагу 📄\n\n' +
        '✨ <b>Mini App:</b>\n' +
        'Для лучшего опыта используй Mini App!\n' +
        'Он открывается через кнопку в меню бота 🎮',
        { parse_mode: 'HTML' }
    );
});

// Обработка выбора в чате
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    
    // Игнорируем команды
    if (text.startsWith('/')) return;
    
    // Обработка выбора в игре
    if (['✊ Камень', '✋ Бумага', '✌️ Ножницы'].includes(text)) {
        const userChoice = text;
        const botChoice = getRandomChoice();
        const result = determineWinner(userChoice, botChoice);
        
        // Эмодзи для результата
        let resultEmoji = '🤝';
        if (result.includes('Ты победил')) resultEmoji = '🎉';
        if (result.includes('Я победил')) resultEmoji = '🤖';
        
        const keyboard = {
            inline_keyboard: [[
                {
                    text: '🎮 Открыть Mini App (рекомендуется!)',
                    web_app: { url: `${webhookUrl}/app` }
                }
            ]]
        };
        
        bot.sendMessage(chatId,
            `🎮 <b>Результат игры</b>\n\n` +
            `👤 <b>Твой выбор:</b> ${userChoice}\n` +
            `🤖 <b>Мой выбор:</b> ${botChoice}\n\n` +
            `🏆 <b>Результат:</b> ${result} ${resultEmoji}\n\n` +
            `✨ <i>Хочешь лучший опыт с анимациями и статистикой?</i>\n` +
            `Открой Mini App для полноценной игры!`,
            {
                parse_mode: 'HTML',
                reply_markup: keyboard
            }
        );
    }
    
    // Обработка других кнопок
    else if (text === '🎮 Открыть Mini App') {
        const keyboard = {
            inline_keyboard: [[
                {
                    text: '🎮 Открыть Mini App',
                    web_app: { url: `${webhookUrl}/app` }
                }
            ]]
        };
        
        bot.sendMessage(chatId,
            '🎮 <b>Отличный выбор!</b>\n\n' +
            'Mini App предлагает:\n' +
            '✨ Красивый интерфейс\n' +
            '📊 Статистику побед\n' +
            '🎯 Анимации\n' +
            '🏆 Счетчик побед\n\n' +
            'Нажми кнопку ниже, чтобы открыть:',
            {
                parse_mode: 'HTML',
                reply_markup: keyboard
            }
        );
    }
    
    else if (text === '📊 Статистика') {
        bot.sendMessage(chatId,
            '📊 <b>Статистика игры</b>\n\n' +
            'Для просмотра статистики используй Mini App!\n\n' +
            '🎮 В Mini App доступно:\n' +
            '• Количество побед/поражений\n' +
            '• История игр\n' +
            '• Достижения\n' +
            '• Рейтинг\n\n' +
            'Открой Mini App для полной статистики!',
            { parse_mode: 'HTML' }
        );
    }
});

// Обработка callback-кнопок
bot.on('callback_query', (callbackQuery) => {
    const msg = callbackQuery.message;
    const data = callbackQuery.data;
    
    if (data === 'quick_play') {
        const keyboard = {
            reply_markup: {
                keyboard: [
                    ['✊ Камень', '✋ Бумага', '✌️ Ножницы']
                ],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        };
        
        bot.sendMessage(msg.chat.id,
            '🎮 <b>Быстрая игра</b>\n\n' +
            'Выбери свой ход на клавиатуре ниже:',
            {
                parse_mode: 'HTML',
                ...keyboard
            }
        );
    }
    
    else if (data === 'stats') {
        bot.sendMessage(msg.chat.id,
            '📊 <b>Статистика</b>\n\n' +
            'Полная статистика доступна в Mini App!\n\n' +
            'В Mini App ты найдешь:\n' +
            '• Количество побед\n' +
            '• Процент побед\n' +
            '• Любимый выбор\n' +
            '• Достижения\n\n' +
            'Открой Mini App для детальной статистики!',
            { parse_mode: 'HTML' }
        );
    }
    
    // Ответ на callback_query (убираем часики)
    bot.answerCallbackQuery(callbackQuery.id);
});

// ================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==================

function getRandomChoice() {
    const choices = ['✊ Камень', '✋ Бумага', '✌️ Ножницы'];
    return choices[Math.floor(Math.random() * choices.length)];
}

function determineWinner(user, bot) {
    if (user === bot) return 'Ничья!';
    
    const winConditions = {
        '✊ Камень': '✌️ Ножницы',
        '✋ Бумага': '✊ Камень', 
        '✌️ Ножницы': '✋ Бумага'
    };
    
    return winConditions[user] === bot ? 'Ты победил!' : 'Я победил!';
}

// ================== ЗАПУСК СЕРВЕРА ==================

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
    console.log(`
    ╔══════════════════════════════════════╗
    ║     БОТ ЗАПУЩЕН УСПЕШНО! 🚀         ║
    ╠══════════════════════════════════════╣
    ║  Порт: ${PORT}                          
    ║  URL: ${webhookUrl}                 
    ║  Mini App: ${webhookUrl}/app        
    ║  Вебхук: ${webhookUrl}/webhook      
    ╠══════════════════════════════════════╣
    ║  Команды для проверки:               
    ║  • ${webhookUrl}/set-webhook        
    ║  • ${webhookUrl}/set-menu-button    
    ║  • ${webhookUrl}/bot-info           
    ║  • ${webhookUrl}/health             
    ╚══════════════════════════════════════╝
    `);
    
    // Установка вебхука
    try {
        await bot.setWebHook(`${webhookUrl}/webhook`);
        console.log('✅ Вебхук установлен');
    } catch (error) {
        console.log('❌ Ошибка установки вебхука:', error.message);
    }
    
    // Настройка кнопки меню
    await setupMenuButton();
    
    console.log('\n📱 Теперь откройте Telegram и найдите своего бота!');
    console.log('🎮 Кнопка Mini App должна появиться в меню бота');
    console.log('✨ Или используйте команду /start в чате с ботом\n');
});
