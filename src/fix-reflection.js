// fix-reflection.js - скрипт для отражения элементов
(function() {
    console.log('Fix Reflection script loaded');
    
    function applyReflection() {
        // 1. Игрок и бот
        const players = document.querySelectorAll('.player, .human, #player');
        const bots = document.querySelectorAll('.bot, .robot, #bot');
        
        players.forEach(p => p.style.transform = 'scaleX(-1)');
        bots.forEach(b => b.style.transform = 'scaleX(1)');
        
        // 2. Кнопки выбора
        const choiceBtns = document.querySelectorAll('button');
        choiceBtns.forEach(btn => {
            if (btn.textContent.includes('КАМЕНЬ') || 
                btn.textContent.includes('БУМАГА') || 
                btn.textContent.includes('НОЖНИЦЫ')) {
                btn.style.transform = 'scaleX(-1)';
                
                // Исправляем текст
                const spans = btn.querySelectorAll('span');
                spans.forEach(span => {
                    span.style.transform = 'scaleX(-1)';
                    span.style.display = 'inline-block';
                });
            }
        });
        
        // 3. Иконки в бою
        const battleIcons = document.querySelectorAll('.battle-icon, .hand-icon');
        battleIcons.forEach(icon => {
            if (icon.classList.contains('player') || 
                icon.id.includes('player')) {
                icon.style.transform = 'scaleX(-1)';
            }
        });
    }
    
    // Применяем при загрузке
    window.addEventListener('load', applyReflection);
    
    // И при каждом изменении DOM (на всякий случай)
    const observer = new MutationObserver(applyReflection);
    observer.observe(document.body, { 
        childList: true, 
        subtree: true 
    });
})();
