const tg = window.Telegram.WebApp;
tg.expand();
tg.setHeaderColor('#667eea');
tg.setBackgroundColor('#667eea');

const choiceBtns = document.querySelectorAll('.choice-btn');
const userChoiceDisplay = document.getElementById('user-choice');
const botChoiceDisplay = document.getElementById('bot-choice');
const resultText = document.getElementById('result-text');
const playAgainBtn = document.getElementById('play-again');
const scoreDisplay = document.getElementById('score');
const shareBtn = document.getElementById('share-btn');

let wins = 0;
let losses = 0;
let draws = 0;

const emojis = {
    rock: '✊',
    paper: '✋',
    scissors: '✌️'
};

const winConditions = {
    rock: 'scissors',
    paper: 'rock',
    scissors: 'paper'
};

choiceBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const userChoice = btn.dataset.choice;
        playGame(userChoice);
    });
});

function playGame(userChoice) {
    choiceBtns.forEach(btn => btn.disabled = true);
    
    userChoiceDisplay.textContent = emojis[userChoice];
    userChoiceDisplay.classList.add('winner');
    
    let count = 0;
    const botChoices = ['rock', 'paper', 'scissors'];
    const interval = setInterval(() => {
        botChoiceDisplay.textContent = emojis[botChoices[count % 3]];
        count++;
    }, 100);
    
    setTimeout(() => {
        clearInterval(interval);
        
        const botChoice = botChoices[Math.floor(Math.random() * 3)];
        botChoiceDisplay.textContent = emojis[botChoice];
        
        const result = determineWinner(userChoice, botChoice);
        updateScore(result);
        
        resultText.textContent = getResultMessage(result, userChoice, botChoice);
        
        userChoiceDisplay.classList.remove('winner');
        
        if (result === 'bot') {
            botChoiceDisplay.classList.add('winner');
        } else if (result === 'user') {
            userChoiceDisplay.classList.add('winner');
        }
        
        playAgainBtn.disabled = false;
    }, 1500);
}

function determineWinner(user, bot) {
    if (user === bot) return 'draw';
    return winConditions[user] === bot ? 'user' : 'bot';
}

function getResultMessage(result, user, bot) {
    const messages = {
        user: ['🎉 Победа!', 'Ты победил!', 'Отлично сыграно!'],
        bot: ['😢 Поражение', 'Бот выиграл', 'Попробуй еще!'],
        draw: ['🤝 Ничья!', 'Одинаково!', 'Снова!']
    };
    
    const randomMsg = messages[result][Math.floor(Math.random() * messages[result].length)];
    
    const details = {
        user: `Ты выбрал: ${getRussianChoice(user)}`,
        bot: `Бот выбрал: ${getRussianChoice(bot)}`,
        draw: `${getRussianChoice(user)} vs ${getRussianChoice(bot)}`
    }[result];
    
    return `${randomMsg}\n${details}`;
}

function getRussianChoice(choice) {
    const names = {
        rock: 'Камень ✊',
        paper: 'Бумага ✋',
        scissors: 'Ножницы ✌️'
    };
    return names[choice];
}

function updateScore(result) {
    if (result === 'user') wins++;
    else if (result === 'bot') losses++;
    else draws++;
    
    scoreDisplay.textContent = `${wins}:${losses}`;
}

playAgainBtn.addEventListener('click', () => {
    userChoiceDisplay.textContent = '?';
    botChoiceDisplay.textContent = '?';
    resultText.textContent = 'Выберите ваш ход!';
    
    userChoiceDisplay.classList.remove('winner');
    botChoiceDisplay.classList.remove('winner');
    
    choiceBtns.forEach(btn => btn.disabled = false);
    playAgainBtn.disabled = true;
});

shareBtn.addEventListener('click', () => {
    const message = `🎮 Я играю в "Бумага vs Камень"!\nСчет: ${wins} побед, ${losses} поражений, ${draws} ничьих\nПрисоединяйся: ${tg.initDataUnsafe.user?.username ? `@${tg.initDataUnsafe.user.username}` : 'через бота'}`;
    
    if (tg.shareMessage) {
        tg.shareMessage(message);
    } else {
        navigator.clipboard.writeText(message);
        resultText.textContent = 'Результат скопирован! 📋';
        setTimeout(() => {
            resultText.textContent = 'Выберите ваш ход!';
        }, 2000);
    }
});

tg.ready();