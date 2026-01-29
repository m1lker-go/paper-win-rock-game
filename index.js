const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const path = require('path');
const axios = require('axios');

const token = '8365584044:AAESH0_vHwEhN9P05xgpJl8MPMNbbEpqRG0';
const webhookUrl = 'https://paper-win-rock.onrender.com';

const bot = new TelegramBot(token, { polling: false });
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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
                </div>
                
                <div style="margin-top: 40px; font-size: 14px; opacity: 0.8;">
                    <p>Bot is running on Render! 🚀</p>
                    <p>Webhook URL: ${webhookUrl}/webhook</p>
                </div>
            </div>
        </body>
        </html>
    `);
});

app.get('/app', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/webhook', (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

async function setupMenuButton() {
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
        console.log('✅ Menu button configured');
    } catch (error) {
        console.log('⚠️ Menu button not set (Mini App still works)');
    }
}

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

bot.onText(/\/play/, (msg) => {
    const chatId = msg.chat.id;
    
    const keyboard = {
        reply_markup: {
            keyboard: [
                ['✊ Камень', '✋ Бумага', '✌️ Ножницы'],
                ['🎮 Открыть Mini App']
            ],
            resize_keyboard: true
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

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    
    if (text.startsWith('/')) return;
    
    if (['✊ Камень', '✋ Бумага', '✌️ Ножницы'].includes(text)) {
        const userChoice = text;
        const botChoice = getRandomChoice();
        const result = determineWinner(userChoice, botChoice);
        
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
});

bot.on('callback_query', (callbackQuery) => {
    const msg = callbackQuery.message;
    const data = callbackQuery.data;
    
    if (data === 'quick_play') {
        const keyboard = {
            reply_markup: {
                keyboard: [
                    ['✊ Камень', '✋ Бумага', '✌️ Ножницы']
                ],
                resize_keyboard: true
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
    
    bot.answerCallbackQuery(callbackQuery.id);
});

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

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🎮 Mini App: ${webhookUrl}/app`);
    
    try {
        await bot.setWebHook(`${webhookUrl}/webhook`);
        console.log('✅ Webhook set');
    } catch (error) {
        console.log('❌ Webhook error:', error.message);
    }
    
    await setupMenuButton();
    console.log('📱 Bot is ready!');
});
