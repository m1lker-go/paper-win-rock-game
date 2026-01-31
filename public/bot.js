const { Telegraf } = require('telegraf');
const express = require('express');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const { v4: uuidv4 } = require('uuid');

// Токен из переменных окружения Render
const BOT_TOKEN = process.env.BOT_TOKEN;
const PORT = process.env.PORT || 3000;
const RENDER_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;

console.log('🚀 Запуск Paper-Win-Rock на Render...');

if (!BOT_TOKEN) {
  console.error('❌ ОШИБКА: Не задан BOT_TOKEN!');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// ============ БАЗА ДАННЫХ (в памяти) ============
const userStats = new Map();
const activePvPGames = new Map();
const pvpQueue = [];
const referrals = new Map();
const sessions = new Map();

// ============ SOCKET.IO РЕАЛЬНОГО ВРЕМЕНИ ============
io.on('connection', (socket) => {
  console.log('🔗 Новое WebSocket подключение:', socket.id);

  socket.on('joinPvPQueue', (data) => {
    const { userId, userName } = data;
    
    console.log(`🎮 Пользователь ${userName} (${userId}) в очереди PvP`);
    
    // Сохраняем socket.id для пользователя
    sessions.set(userId, { socketId: socket.id, userName });
    
    // Проверяем, есть ли противник в очереди
    if (pvpQueue.length > 0) {
      const opponent = pvpQueue.shift();
      
      // Создаем игру
      const gameId = uuidv4();
      const game = {
        id: gameId,
        player1: opponent.userId,
        player2: userId,
        player1Name: opponent.userName,
        player2Name: userName,
        player1Choice: null,
        player2Choice: null,
        status: 'active',
        createdAt: Date.now()
      };
      
      activePvPGames.set(gameId, game);
      
      // Уведомляем обоих игроков
      io.to(sessions.get(opponent.userId).socketId).emit('pvpMatchFound', {
        gameId,
        opponentId: userId,
        opponentName: userName,
        message: 'Противник найден!'
      });
      
      socket.emit('pvpMatchFound', {
        gameId,
        opponentId: opponent.userId,
        opponentName: opponent.userName,
        message: 'Противник найден!'
      });
      
      console.log(`🎲 Создана PvP игра ${gameId}: ${opponent.userName} vs ${userName}`);
    } else {
      // Добавляем в очередь
      pvpQueue.push({ userId, userName, socketId: socket.id });
      socket.emit('pvpQueueJoined', {
        message: 'В очереди. Ищем противника...',
        position: pvpQueue.length
      });
    }
  });

  socket.on('makePvPMove', (data) => {
    const { gameId, userId, choice } = data;
    const game = activePvPGames.get(gameId);
    
    if (!game) {
      socket.emit('error', { message: 'Игра не найдена' });
      return;
    }
    
    // Записываем ход
    if (game.player1 === userId) {
      game.player1Choice = choice;
    } else if (game.player2 === userId) {
      game.player2Choice = choice;
    }
    
    // Проверяем, сделали ли оба хода
    if (game.player1Choice && game.player2Choice) {
      // Определяем победителя
      const result = determineWinner(game.player1Choice, game.player2Choice);
      const winner = result === 'player1' ? game.player1 : result === 'player2' ? game.player2 : null;
      
      // Обновляем статистику
      updateStats(game.player1, result === 'player1' ? 'win' : result === 'player2' ? 'lose' : 'draw');
      updateStats(game.player2, result === 'player2' ? 'win' : result === 'player1' ? 'lose' : 'draw');
      
      // Отправляем результат обоим игрокам
      const resultData = {
        gameId,
        winner,
        player1Choice: game.player1Choice,
        player2Choice: game.player2Choice,
        isDraw: result === 'draw'
      };
      
      // Ищем socket.id игроков
      const player1Socket = sessions.get(game.player1)?.socketId;
      const player2Socket = sessions.get(game.player2)?.socketId;
      
      if (player1Socket) io.to(player1Socket).emit('pvpGameResult', resultData);
      if (player2Socket) io.to(player2Socket).emit('pvpGameResult', resultData);
      
      // Удаляем игру через 30 секунд
      setTimeout(() => {
        activePvPGames.delete(gameId);
      }, 30000);
    } else {
      // Уведомляем противника о ходе
      const opponentId = game.player1 === userId ? game.player2 : game.player1;
      const opponentSocket = sessions.get(opponentId)?.socketId;
      
      if (opponentSocket) {
        io.to(opponentSocket).emit('opponentMoved', {
          gameId,
          message: 'Противник сделал ход!'
        });
      }
    }
  });

  socket.on('cancelPvPQueue', (userId) => {
    // Удаляем из очереди
    const index = pvpQueue.findIndex(p => p.userId === userId);
    if (index !== -1) {
      pvpQueue.splice(index, 1);
      console.log(`❌ Пользователь ${userId} вышел из очереди`);
    }
  });

  socket.on('disconnect', () => {
    console.log('🔌 WebSocket отключен:', socket.id);
    // Очищаем сессии
    for (const [userId, session] of sessions.entries()) {
      if (session.socketId === socket.id) {
        sessions.delete(userId);
        break;
      }
    }
  });
});

// ============ ФУНКЦИИ ============
function determineWinner(choice1, choice2) {
  if (choice1 === choice2) return 'draw';
  
  const rules = {
    'rock': 'scissors',
    'scissors': 'paper',
    'paper': 'rock'
  };
  
  return rules[choice1] === choice2 ? 'player1' : 'player2';
}

function updateStats(userId, result) {
  if (!userStats.has(userId)) {
    userStats.set(userId, {
      gold: 100,
      wins: 0,
      losses: 0,
      draws: 0,
      gamesPlayed: 0
    });
  }
  
  const stats = userStats.get(userId);
  stats.gamesPlayed += 1;
  
  if (result === 'win') {
    stats.wins += 1;
    stats.gold += 10;
  } else if (result === 'lose') {
    stats.losses += 1;
    stats.gold = Math.max(0, stats.gold - 5);
  } else {
    stats.draws += 1;
    stats.gold += 2;
  }
  
  userStats.set(userId, stats);
}

function generateReferralCode(userId) {
  return `PWR_${userId}_${Date.now().toString(36)}`;
}

// ============ API ДЛЯ ИГРЫ ============
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Получение статистики пользователя
app.get('/api/user/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  
  if (userStats.has(userId)) {
    res.json({
      success: true,
      ...userStats.get(userId)
    });
  } else {
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
    stats.gold += goldChange;
    stats.gamesPlayed += 1;
    
    if (result === 'win') stats.wins += 1;
    else if (result === 'lose') stats.losses += 1;
    else if (result === 'draw') stats.draws += 1;
    
    stats.gold = Math.max(0, stats.gold);
    userStats.set(userIdNum, stats);
    
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Реферальная система API
app.post('/api/referral/register', (req, res) => {
  const { userId, referralCode } = req.body;
  
  if (!referralCode || !userId) {
    return res.status(400).json({ success: false, message: 'Неверные данные' });
  }
  
  // Проверяем, есть ли такой реферальный код
  const referrerId = referralCode.split('_')[1];
  if (!referrerId || referrerId === userId.toString()) {
    return res.status(400).json({ success: false, message: 'Неверный реферальный код' });
  }
  
  // Сохраняем реферала
  if (!referrals.has(referrerId)) {
    referrals.set(referrerId, []);
  }
  
  const referrerList = referrals.get(referrerId);
  if (!referrerList.includes(userId)) {
    referrerList.push(userId);
    
    // Начисляем бонус пригласившему
    if (userStats.has(referrerId)) {
      const stats = userStats.get(referrerId);
      stats.gold += 50;
      userStats.set(referrerId, stats);
    }
  }
  
  res.json({ success: true, message: 'Реферал зарегистрирован' });
});

app.get('/api/referral/:userId/stats', (req, res) => {
  const userId = req.params.userId;
  const referrerList = referrals.get(userId) || [];
  
  res.json({
    success: true,
    referrals: referrerList.length,
    list: referrerList
  });
});

// API для PvP
app.get('/api/pvp/queue', (req, res) => {
  res.json({
    success: true,
    queueSize: pvpQueue.length,
    activeGames: activePvPGames.size
  });
});

app.get('/api/pvp/game/:gameId', (req, res) => {
  const game = activePvPGames.get(req.params.gameId);
  if (game) {
    res.json({ success: true, game });
  } else {
    res.status(404).json({ success: false, message: 'Игра не найдена' });
  }
});
// Добавьте после существующих импортов:
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
// ============ КОМАНДЫ БОТА ============
bot.start(async (ctx) => {
  const userId = ctx.from.id;
  const userName = ctx.from.first_name;
  const args = ctx.payload; // Параметр после start (например, ?start=PWR_123)
  
  // Обработка реферальной ссылки
  if (args && args.startsWith('PWR_')) {
    const referralCode = args;
    const referrerId = args.split('_')[1];
    
    if (referrerId && referrerId !== userId.toString()) {
      // Регистрируем реферала через API
      try {
        const response = await fetch(`${RENDER_URL}/api/referral/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, referralCode })
        });
        
        const data = await response.json();
        if (data.success) {
          ctx.reply(`🎉 Вы присоединились по приглашению! Получено 10 кристаллов бонуса.`);
        }
      } catch (error) {
        console.error('Ошибка регистрации реферала:', error);
      }
    }
  }
  
  // Генерация реферальной ссылки для пользователя
  const userReferralCode = generateReferralCode(userId);
  const referralLink = `https://t.me/${ctx.botInfo.username}?start=${userReferralCode}`;
  
  const message = `🎮 *Paper-Win-Rock*\n\n` +
    `Привет, ${userName}! 👋\n\n` +
    `*Ваша реферальная ссылка:*\n\`${referralLink}\`\n\n` +
    `Приглашайте друзей и получайте бонусы!\n` +
    `• За друга: +50 кристаллов\n` +
    `• За друга с Premium: +250 кристаллов\n\n` +
    `Нажми кнопку ниже, чтобы открыть игру:`;
  
  ctx.reply(message, {
    parse_mode: 'Markdown',
    reply_markup: {
      keyboard: [
        [{ text: '🎮 Играть', web_app: { url: RENDER_URL } }],
        [{ text: '📊 Статистика' }, { text: '👥 Рефералы' }],
        [{ text: '📖 Правила' }, { text: '🤝 PvP Бои' }]
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
  
  // Получаем статистику рефералов
  const referralStats = referrals.get(userId.toString()) || [];
  
  ctx.reply(
    `📊 *Твоя статистика:*\n\n` +
    `💎 Кристаллы: ${stats.gold}\n` +
    `🏆 Побед: ${stats.wins}\n` +
    `😢 Поражений: ${stats.losses}\n` +
    `🤝 Ничьих: ${stats.draws}\n` +
    `🎮 Всего игр: ${stats.gamesPlayed}\n` +
    `📈 Процент побед: ${winRate}%\n\n` +
    `👥 *Рефералы:* ${referralStats.length} человек\n` +
    `💰 Заработано с рефералов: ${referralStats.length * 50} кристаллов\n\n` +
    `Продолжай в том же духе! 💪`,
    { parse_mode: 'Markdown' }
  );
});

bot.hears('👥 Рефералы', async (ctx) => {
  const userId = ctx.from.id;
  const referralCode = generateReferralCode(userId);
  const referralLink = `https://t.me/${ctx.botInfo.username}?start=${referralCode}`;
  
  // Получаем статистику рефералов
  const referralStats = referrals.get(userId.toString()) || [];
  
  ctx.reply(
    `👥 *Реферальная система*\n\n` +
    `*Ваша ссылка:*\n\`${referralLink}\`\n\n` +
    `*Приглашено:* ${referralStats.length} человек\n` +
    `*Заработано:* ${referralStats.length * 50} 💎\n\n` +
    `*Бонусы:*\n` +
    `• За обычного пользователя: *+50 💎*\n` +
    `• За Telegram Premium: *+250 💎*\n\n` +
    `Поделитесь ссылкой с друзьями!`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📋 Копировать ссылку', callback_data: 'copy_referral' }],
          [{ text: '📤 Поделиться', callback_data: 'share_referral' }]
        ]
      }
    }
  );
});

bot.hears('🤝 PvP Бои', (ctx) => {
  ctx.reply(
    `⚔️ *PvP Режим*\n\n` +
    `Сражайтесь с реальными игроками!\n\n` +
    `*Как играть:*\n` +
    `1. Нажмите "🎮 Играть"\n` +
    `2. Выберите "PvP Бой"\n` +
    `3. Система найдет противника\n` +
    `4. Сделайте свой ход за 10 секунд\n\n` +
    `*Награды:*\n` +
    `• Победа: +15 💎\n` +
    `• Ничья: +5 💎\n` +
    `• Поражение: +2 💎\n\n` +
    `*В очереди сейчас:* ${pvpQueue.length} игроков`,
    { parse_mode: 'Markdown' }
  );
});

bot.action('copy_referral', (ctx) => {
  const userId = ctx.from.id;
  const referralCode = generateReferralCode(userId);
  const referralLink = `https://t.me/${ctx.botInfo.username}?start=${referralCode}`;
  
  ctx.answerCbQuery('Ссылка скопирована!');
  ctx.reply(`Ваша реферальная ссылка:\n${referralLink}\n\nСкопируйте и отправьте другу!`);
});

bot.action('share_referral', (ctx) => {
  const userId = ctx.from.id;
  const referralCode = generateReferralCode(userId);
  const referralLink = `https://t.me/${ctx.botInfo.username}?start=${referralCode}`;
  
  ctx.answerCbQuery('Открываю меню шаринга...');
  ctx.reply(
    `Поделитесь с друзьями:\n\n${referralLink}\n\nИли просто перешлите это сообщение!`,
    {
      reply_markup: {
        inline_keyboard: [[
          { text: '📤 Поделиться в Telegram', url: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Присоединяйся к Paper Win Rock! 🎮')}` }
        ]]
      }
    }
  );
});

bot.hears('📖 Правила', (ctx) => {
  ctx.reply(
    `📖 *Правила игры:*\n\n` +
    `🎮 **Как играть:**\n` +
    `1. Нажми "🎮 Играть"\n` +
    `2. Выбери режим (бот/PvP)\n` +
    `3. Выбери руку (камень/ножницы/бумага)\n` +
    `4. У тебя есть 10 секунд на выбор!\n\n` +
    `⚔️ **Правила победы:**\n` +
    `• Камень (✊) бьет ножницы (✌)\n` +
    `• Ножницы (✌) бьют бумагу (✋)\n` +
    `• Бумага (✋) бьет камень (✊)\n\n` +
    `💎 **Награды:**\n` +
    `• Победа в PvP: +15 кристаллов\n` +
    `• Ничья в PvP: +5 кристаллов\n` +
    `• Победа с ботом: +10 кристаллов\n` +
    `• Ничья с ботом: +2 кристалла\n` +
    `• Поражение: +1 кристалл\n\n` +
    `👥 **Реферальная система:**\n` +
    `Приглашайте друзей по своей ссылке!\n\n` +
    `Удачи! 🍀`,
    { parse_mode: 'Markdown' }
  );
});

// Ответ на любой текст
bot.on('text', (ctx) => {
  if (!ctx.message.text.startsWith('/')) {
    ctx.reply(`Используй /start или кнопки в меню! 🎮`);
  }
});

// ============ СЕРВЕР ============
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    game: 'Paper-Win-Rock',
    version: '2.0.0',
    playersOnline: sessions.size,
    pvpQueue: pvpQueue.length,
    activeGames: activePvPGames.size
  });
});

// Запуск сервера
server.listen(PORT, () => {
  console.log(`✅ Сервер запущен на порту ${PORT}`);
  console.log(`🎮 Игра доступна по адресу: ${RENDER_URL}`);
  console.log(`🔌 WebSocket включен`);
  
  bot.launch()
    .then(() => {
      console.log(`\n🎉 БОТ УСПЕШНО ЗАПУЩЕН!`);
      console.log(`🤖 Имя бота: @${bot.botInfo.username}`);
      console.log(`📊 Игроков онлайн: ${sessions.size}`);
    })
    .catch((error) => {
      console.error('\n❌ ОШИБКА ЗАПУСКА БОТА:', error.message);
    });
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

