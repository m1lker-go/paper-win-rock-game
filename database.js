// database.js
const { MongoClient } = require('mongodb');
const uuid = require('uuid');

class Database {
    constructor() {
        this.client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
        this.db = null;
        this.games = new Map(); // Активные игры в памяти
        this.queue = []; // Очередь ожидания PvP
    }

    async connect() {
        await this.client.connect();
        this.db = this.client.db('paper_win_rock');
        console.log('База данных подключена');
    }

    // Реферальная система
    async addReferral(userId, referrerId) {
        const users = this.db.collection('users');
        
        // Проверяем, новый ли пользователь
        const existingUser = await users.findOne({ telegramId: userId });
        if (existingUser) return false;

        // Сохраняем реферала
        await users.updateOne(
            { telegramId: referrerId },
            { 
                $inc: { referrals: 1, bonuses: 50 },
                $push: { referralList: userId }
            },
            { upsert: true }
        );

        // Сохраняем самого пользователя
        await users.insertOne({
            telegramId: userId,
            referrerId: referrerId,
            joinedAt: new Date(),
            bonuses: 0,
            gamesPlayed: 0
        });

        return true;
    }

    async getUserStats(userId) {
        const users = this.db.collection('users');
        return await users.findOne({ telegramId: userId });
    }

    // PvP система
    async findPvPOpponent(userId) {
        // Убираем из очереди, если уже есть
        this.queue = this.queue.filter(id => id !== userId);
        
        // Ищем противника
        if (this.queue.length > 0) {
            const opponentId = this.queue.shift();
            const gameId = uuid.v4();
            
            // Создаем игру
            this.games.set(gameId, {
                player1: userId,
                player2: opponentId,
                player1Choice: null,
                player2Choice: null,
                status: 'waiting',
                createdAt: Date.now()
            });
            
            return { gameId, opponentId };
        } else {
            // Добавляем в очередь ожидания
            this.queue.push(userId);
            return null;
        }
    }

    async makePvPMove(gameId, playerId, choice) {
        const game = this.games.get(gameId);
        if (!game) return null;

        // Записываем ход
        if (game.player1 === playerId) {
            game.player1Choice = choice;
        } else if (game.player2 === playerId) {
            game.player2Choice = choice;
        }

        // Проверяем, оба ли сделали ход
        if (game.player1Choice && game.player2Choice) {
            game.status = 'completed';
            
            // Определяем победителя
            const result = this.calculateResult(
                game.player1Choice, 
                game.player2Choice
            );
            
            game.result = result;
            return result;
        }

        return { status: 'waiting' };
    }

    calculateResult(choice1, choice2) {
        const rules = {
            'rock': 'scissors',
            'scissors': 'paper', 
            'paper': 'rock'
        };

        if (choice1 === choice2) return { winner: null, draw: true };
        if (rules[choice1] === choice2) return { winner: 1, draw: false };
        return { winner: 2, draw: false };
    }

    async cleanupOldGames() {
        const now = Date.now();
        for (const [gameId, game] of this.games.entries()) {
            if (now - game.createdAt > 300000) { // 5 минут
                this.games.delete(gameId);
            }
        }
    }
}

module.exports = new Database();
