const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

// НОВЫЙ ТОКЕН БОТА
const token = '8365584044:AAESH0_vHwEhN9P05xgpJl8MPMNbbEpqRG0';
const webhookUrl = 'https://paper-win-rock.onrender.com';

const bot = new TelegramBot(token, { polling: false });
const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Bot is running on Render! 🚀');
});

app.post('/webhook', (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

app.get('/set-webhook', async (req, res) => {
  try {
    await bot.setWebHook(`${webhookUrl}/webhook`);
    res.send('Webhook set successfully! ✅');
  } catch (error) {
    res.send('Error setting webhook: ' + error.message);
  }
});

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Привет! Я бот "Бумага побеждает камень" 🎮\n\nИспользуй /play чтобы начать игру!');
});

bot.onText(/\/play/, (msg) => {
  const chatId = msg.chat.id;
  const options = {
    reply_markup: {
      keyboard: [
        ['✊ Камень', '✋ Бумага'],
        ['✌️ Ножницы']
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    }
  };
  bot.sendMessage(chatId, 'Выбери свой ход:', options);
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  
  if (['✊ Камень', '✋ Бумага', '✌️ Ножницы'].includes(text)) {
    // Определяем победителя
    const userChoice = text;
    const botChoice = getRandomChoice();
    const result = determineWinner(userChoice, botChoice);
    
    bot.sendMessage(chatId, 
      `Твой выбор: ${userChoice}\n` +
      `Мой выбор: ${botChoice}\n\n` +
      `Результат: ${result}\n\n` +
      `Используй /play чтобы сыграть еще раз!`
    );
  }
});

function getRandomChoice() {
  const choices = ['✊ Камень', '✋ Бумага', '✌️ Ножницы'];
  return choices[Math.floor(Math.random() * choices.length)];
}

function determineWinner(user, bot) {
  if (user === bot) return 'Ничья! 🤝';
  
  const winConditions = {
    '✊ Камень': '✌️ Ножницы',
    '✋ Бумага': '✊ Камень', 
    '✌️ Ножницы': '✋ Бумага'
  };
  
  return winConditions[user] === bot ? 'Ты победил! 🎉' : 'Я победил! 🤖';
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
