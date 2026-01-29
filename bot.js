const { Telegraf } = require('telegraf');
const express = require('express');
const path = require('path');
const https = require('https'); // Добавим для keep-alive

// Токен из переменных окружения Render
const BOT_TOKEN = process.env.BOT_TOKEN;
const PORT = process.env.PORT || 3000;

// URL будет автоматически от Render
const RENDER_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;

console.log('🚀 Запуск Paper-Win-Rock на Render...');
console.log(`🌐 Render URL: ${RENDER_URL}`);

// Проверка токена
if (!BOT_TOKEN) {
  console.error('❌ ОШИБКА: Не задан BOT_TOKEN!');
  console.log('📝 Как исправить:');
  console.log('1. Зайдите в Dashboard Render → ваш сервис');
  console.log('2. Нажмите "Environment"');
  console.log('3. Добавьте переменную BOT_TOKEN со значением вашего токена');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
const app = express();

// Хранилище данных пользователей (в памяти)
const userStats = new Map();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ============ API ДЛЯ ИГРЫ ============
// Получение статистики пользователя
app.get('/api/user/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  
  if (userStats.has(userId)) {
    res.json({
      success: true,
      ...userStats.get(userId)
    });
  } else {
    // Создаем нового пользователя
    const newUser = {
      gold: 100,
      wins: 0,
      losses: 0,
      draws: 0,
      gamesPlayed: 0
    };
    userStats.set(userId, newUser);
    res.json({
      success: true,
      ...newUser
    });
  }
});

// Обновление статистики после игры
app.post('/api/update', (req, res) => {
  try {
    const { userId, result, goldChange } = req.body;
    const userIdNum = parseInt(userId);
    
    if (!userStats.has(userIdNum)) {
      userStats.set(userIdNum, {
        gold: 100,
        wins: 0,
        losses: 0,
        draws: 0,
        gamesPlayed: 0
      });
    }
    
    const stats = userStats.get(userIdNum);
    
    // Обновляем статистику
    stats.gold += goldChange;
    stats.gamesPlayed += 1;
    
    if (result === 'win') stats.wins += 1;
    else if (result === 'lose') stats.losses += 1;
    else if (result === 'draw') stats.draws += 1;
    
    // Не даем уйти в минус
    stats.gold = Math.max(0, stats.gold);
    
    userStats.set(userIdNum, stats);
    
    console.log(`📊 Обновлена статистика пользователя ${userIdNum}:`, stats);
    
    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error('❌ Ошибка обновления статистики:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// ============ КОМАНДЫ БОТА ============
bot.start((ctx) => {
  const userId = ctx.from.id;
  const userName = ctx.from.first_name;
  
  console.log(`👤 Новый пользователь: ${userName} (${userId})`);
  
  const message = `🎮 *Paper-Win-Rock*\n\n` +
    `Привет, ${userName}! 👋\n\n` +
    `Нажми кнопку ниже, чтобы открыть игру прямо в Telegram!`;
  
  ctx.reply(message, {
    parse_mode: 'Markdown',
    reply_markup: {
      keyboard: [
        [{ text: '🎮 Играть', web_app: { url: RENDER_URL } }],
        [{ text: '📊 Статистика' }, { text: '📖 Правила' }]
      ],
      resize_keyboard: true
    }
  });
});

bot.hears('📊 Статистика', (ctx) => {
  const userId = ctx.from.id;
  const stats = userStats.get(userId) || {
    gold: 100,
    wins: 0,
    losses: 0,
    draws: 0,
    gamesPlayed: 0
  };
  
  const winRate = stats.gamesPlayed > 0 
    ? ((stats.wins / stats.gamesPlayed) * 100).toFixed(1) 
    : 0;
  
  ctx.reply(
    `📊 *Твоя статистика:*\n\n` +
    `💎 Кристаллы: ${stats.gold}\n` +
    `🏆 Побед: ${stats.wins}\n` +
    `😢 Поражений: ${stats.losses}\n` +
    `🤝 Ничьих: ${stats.draws}\n` +
    `🎮 Всего игр: ${stats.gamesPlayed}\n` +
    `📈 Процент побед: ${winRate}%\n\n` +
    `Продолжай в том же духе! 💪`,
    { parse_mode: 'Markdown' }
  );
});

bot.hears('📖 Правила', (ctx) => {
  ctx.reply(
    `📖 *Правила игры:*\n\n` +
    `🎮 **Как играть:**\n` +
    `1. Нажми "🎮 Играть"\n` +
    `2. Выбери руку (камень/ножницы/бумага)\n` +
    `3. У тебя есть 10 секунд на выбор!\n` +
    `4. Соперник делает случайный выбор\n\n` +
    `⚔️ **Правила победы:**\n` +
    `• Камень (✊) бьет ножницы (✌)\n` +
    `• Ножницы (✌) бьют бумагу (✋)\n` +
    `• Бумага (✋) бьет камень (✊)\n\n` +
    `💎 **Награды:**\n` +
    `• Победа: +10 кристаллов\n` +
    `• Ничья: +2 кристалла\n` +
    `• Поражение: -5 кристаллов\n\n` +
    `Удачи! 🍀`,
    { parse_mode: 'Markdown' }
  );
});

// Ответ на любой текст
bot.on('text', (ctx) => {
  if (!ctx.message.text.startsWith('/')) {
    ctx.reply(
      `Используй /start или кнопки в меню! 🎮`
    );
  }
});

// ============ СЕРВЕР ============
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Эндпоинт для проверки статуса
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    game: 'Paper-Win-Rock',
    version: '1.0.0'
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`✅ Сервер запущен на порту ${PORT}`);
  console.log(`🎮 Игра доступна по адресу: ${RENDER_URL}`);
});

// ============ ЗАПУСК БОТА ============
bot.launch()
  .then(() => {
    console.log(`\n🎉 БОТ УСПЕШНО ЗАПУЩЕН!`);
    console.log(`🤖 Имя бота: @${bot.botInfo.username}`);
    console.log(`🔗 Ссылка на бота: https://t.me/${bot.botInfo.username}`);
    console.log(`🌐 URL игры: ${RENDER_URL}`);
    console.log(`\n📱 **Инструкция:**`);
    console.log(`1. Откройте Telegram`);
    console.log(`2. Найдите бота: @${bot.botInfo.username}`);
    console.log(`3. Нажмите /start`);
    console.log(`4. Нажмите кнопку "🎮 Играть"`);
    console.log(`5. Игра откроется прямо в Telegram!`);
  })
  .catch((error) => {
    console.error('\n❌ ОШИБКА ЗАПУСКА БОТА:', error.message);
    console.log('\n🔧 **ВОЗМОЖНЫЕ РЕШЕНИЯ:**');
    console.log('1. Проверьте токен бота в переменных окружения Render');
    console.log('2. Убедитесь, что интернет работает');
    console.log('3. Перезапустите сервис на Render');
  });

// Graceful shutdown
process.once('SIGINT', () => {
  console.log('\n🛑 Остановка бота...');
  bot.stop('SIGINT');
  process.exit(0);
});

process.once('SIGTERM', () => {
  console.log('\n🛑 Остановка бота...');
  bot.stop('SIGTERM');
  process.exit(0);
});