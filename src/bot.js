console.log('🚀 Запуск Paper-Win-Rock...');
console.log('📁 Текущая директория:', __dirname);

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
console.log('📁 Текущая директория:', __dirname);

if (!BOT_TOKEN) {
  console.error('❌ ОШИБКА: Не задан BOT_TOKEN!');
  console.error('ℹ️ Установите BOT_TOKEN в настройках Render Environment');
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
      const opponentSession = sessions.get(opponent.userId);
      if (opponentSession) {
        io.to(opponentSession.socketId).emit('pvpMatchFound', {
          gameId,
          opponentId: userId,
          opponentName: userName,
          message: 'Противник найден!'
        });
      }
      
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
app.use(express.urlencoded({ extended: true }));

// Раздача статических файлов
app.use(express.static(path.join(__dirname, '..')));
app.use('/client', express.static(path.join(__dirname, '../client')));
app.use('/public', express.static(path.join(__dirname, '../public')));
// Главная страница
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});
    <!DOCTYPE html>
    <html>
    <head>
        <title>Paper Win Rock 🎮</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {
                font-family: Arial, sans-serif;
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
                font-size: 3rem;
                margin-bottom: 20px;
            }
            .btn {
                display: inline-block;
                background: linear-gradient(45deg, #ff9f43, #ff7f00);
                color: white;
                padding: 15px 30px;
                border-radius: 50px;
                text-decoration: none;
                font-size: 1.2rem;
                font-weight: bold;
                margin: 15px;
                transition: all 0.3s ease;
            }
            .btn:hover {
                transform: translateY(-3px);
                box-shadow: 0 6px 20px rgba(255, 159, 67, 0.6);
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🎮 Paper Win Rock</h1>
            <p>Добро пожаловать в игру Камень-Ножницы-Бумага с PvP режимом!</p>
            <p>Сервер работает корректно. Бот запущен.</p>
            <a href="https://t.me/PaperWinRock_bot" class="btn" target="_blank">🚀 Перейти к боту в Telegram</a>
            <p><small>Используйте Telegram бота для игры</small></p>
        </div>
    </body>
    </html>
  `);
});

// API эндпоинты
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

// Health check для Render
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

// ============ КОМАНДЫ БОТА ============
bot.start(async (ctx) => {
  const userId = ctx.from.id;
  const userName = ctx.from.first_name;
  const args = ctx.payload;
  
  // Обработка реферальной ссылки
  if (args && args.startsWith('PWR_')) {
    const referralCode = args;
    const referrerId = args.split('_')[1];
    
    if (referrerId && referrerId !== userId.toString()) {
      try {
        const response = await fetch(`${RENDER_URL}/api/referral/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, referralCode })
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            ctx.reply(`🎉 Вы присоединились по приглашению! Получено 10 кристаллов бонуса.`);
          }
        }
      } catch (error) {
        console.error('Ошибка регистрации реферала:', error);
      }
    }
  }
  
  const userReferralCode = generateReferralCode(userId);
  const referralLink = `https://t.me/${ctx.botInfo.username}?start=${userReferralCode}`;
  
  const message = `🎮 *Paper-Win-Rock*\n\n` +
    `Привет, ${userName}! 👋\n\n` +
    `*Ваша реферальная ссылка:*\n\`${referralLink}\`\n\n` +
    `Приглашайте друзей и получайте бонусы!\n` +
    `• За друга: +50 кристаллов\n\n` +
    `Игра доступна через веб-интерфейс: ${RENDER_URL}`;
  
  ctx.reply(message, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🎮 Открыть игру', web_app: { url: RENDER_URL } }],
        [{ text: '📊 Статистика', callback_data: 'stats' }],
        [{ text: '👥 Рефералы', callback_data: 'referrals' }]
      ]
    }
  });
});

bot.action('stats', (ctx) => {
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
    `📈 Процент побед: ${winRate}%\n\n`,
    { parse_mode: 'Markdown' }
  );
});

bot.action('referrals', (ctx) => {
  const userId = ctx.from.id;
  const referralCode = generateReferralCode(userId);
  const referralLink = `https://t.me/${ctx.botInfo.username}?start=${referralCode}`;
  
  ctx.reply(
    `👥 *Реферальная система*\n\n` +
    `*Ваша ссылка:*\n\`${referralLink}\`\n\n` +
    `*Бонусы:*\n` +
    `• За приглашенного друга: *+50 💎*\n\n` +
    `Поделитесь ссылкой с друзьями!`,
    {
      parse_mode: 'Markdown'
    }
  );
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



