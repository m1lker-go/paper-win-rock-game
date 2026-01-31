// websocket.js
const WebSocket = require('ws');
const db = require('./database');

class WebSocketServer {
    constructor(server) {
        this.wss = new WebSocket.Server({ server });
        this.connections = new Map(); // userId -> WebSocket
        
        this.wss.on('connection', (ws, req) => {
            const userId = this.getUserIdFromRequest(req);
            if (userId) {
                this.connections.set(userId, ws);
                console.log(`WebSocket подключен: ${userId}`);
                
                ws.on('close', () => {
                    this.connections.delete(userId);
                });
                
                // Отправляем статус игры
                ws.on('message', async (data) => {
                    const message = JSON.parse(data);
                    await this.handleMessage(userId, message);
                });
            }
        });
    }

    getUserIdFromRequest(req) {
        // Извлекаем userId из URL или headers
        const url = new URL(req.url, `http://${req.headers.host}`);
        return url.searchParams.get('userId');
    }

    async handleMessage(userId, message) {
        switch (message.type) {
            case 'findPvP':
                const match = await db.findPvPOpponent(userId);
                if (match) {
                    // Уведомляем обоих игроков
                    this.notifyUser(userId, {
                        type: 'opponentFound',
                        gameId: match.gameId,
                        opponentId: match.opponentId
                    });
                    
                    this.notifyUser(match.opponentId, {
                        type: 'opponentFound',
                        gameId: match.gameId,
                        opponentId: userId
                    });
                }
                break;
                
            case 'makeMove':
                const result = await db.makePvPMove(
                    message.gameId, 
                    userId, 
                    message.choice
                );
                
                if (result && result.winner) {
                    // Отправляем результат обоим игрокам
                    const game = db.games.get(message.gameId);
                    this.sendGameResult(game, result);
                }
                break;
        }
    }

    notifyUser(userId, data) {
        const ws = this.connections.get(userId);
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(data));
        }
    }

    sendGameResult(game, result) {
        this.notifyUser(game.player1, {
            type: 'gameResult',
            result: result,
            yourChoice: game.player1Choice,
            opponentChoice: game.player2Choice
        });
        
        this.notifyUser(game.player2, {
            type: 'gameResult',
            result: result,
            yourChoice: game.player2Choice,
            opponentChoice: game.player1Choice
        });
    }
}

module.exports = WebSocketServer;
