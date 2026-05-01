const catBot = {
    welcome: "🐱 Мяу! Я Кот-помощник Мурзик. Спрашивай что угодно о гостинице, кошках или просто поболтаем!",
    
    localAnswers: {
        "сколько стоит": "Цены от 1200₽ за ночь в стандартном номере. Люкс — 2500₽, VIP — 4000₽",
        "как забронировать": "Нажми на кнопку 'Бронирование' в меню, выбери номер и даты",
        "есть ли скидки": "Да! Для постоянных клиентов скидка 10%, для новичков первый день бесплатно!",
        "прививки": "Обязательны прививки от бешенства и комплексная. Пришлите фото паспорта",
        "кормление": "Мы кормим Royal Canin, но можем давать ваш корм бесплатно",
        "веб камера": "В VIP-номерах есть веб-камера, смотрите за кошкой в приложении",
        "ветеринар": "Ветеринар на связи 24/7, осмотр бесплатно при заселении",
        "трансфер": "Можем привезти кошку из любой точки города за 500₽",
        "игровая комната": "Да, 2 часа бесплатных игр в день, потом 200₽/час",
        "отзывы": "Наши гости оценивают нас на 4.9⭐, почитайте в разделе 'Отзывы'",
        "работаете круглосуточно": "Да, отель работает 24/7, можете привезти кошку в любое время",
        "сколько кошек": "В одном номере можно разместить до 3 кошек из одной семьи",
        "есть ли окна": "Да, во всех номерах есть окна с защитными сетками",
        "как к вам доехать": "Москва, ул. Кошачья 15. Ближайшее метро — Курская",
        "привет": "Привет! Мяу-мяу! Чем помочь?",
        "здравствуй": "Здравствуйте! Рад вас видеть! 🐾",
        "как дела": "У меня всё отлично! Только что поймал виртуальную мышку 🐭",
        "кто ты": "Я Мурзик — главный кот-администратор отеля!",
        "спасибо": "Пожалуйста! Всегда рад помочь! 🐾",
        "пока": "До свидания! Приходите к нам с кошечкой! 🐱",
        "помощь": "Я могу рассказать о ценах, бронировании, прививках, кормлении и других услугах. Просто спроси!",
        "номер": "У нас есть Стандарт (1200₽), Люкс (2500₽) и VIP Вилла (4000₽)",
        "забронировать": "Перейдите в раздел 'Бронирование' в меню сайта",
        "какие документы": "Нужен ветеринарный паспорт с прививками",
        "есть ли скидка": "Да, для постоянных клиентов скидка 10%"
    },
    
    getLocalAnswer(question) {
        const lowerQ = question.toLowerCase();
        for (const [key, answer] of Object.entries(this.localAnswers)) {
            if (lowerQ.includes(key)) {
                return answer + " 🐱";
            }
        }
        return null;
    },
    
    generateSmartAnswer(question) {
        const q = question.toLowerCase();
        
        if (q.includes("почему") || q.includes("как")) {
            return "Хороший вопрос! Лучше спросить у администратора по телефону +7 (999) 123-45-67. Я ещё маленький кот, но учусь! 🐱";
        }
        
        if (q.includes("когда") || q.includes("где")) {
            return "Точную информацию я уточню у человека. Звоните нам в любое время! 📞";
        }
        
        if (q.includes("люблю") || q.includes("киса") || q.includes("кошка")) {
            return "Муррр! Я тоже люблю кошек! Приезжайте к нам с вашей пушистой подругой 🐾";
        }
        
        if (q.includes("цена") || q.includes("стоимость")) {
            return "Стандарт — 1200₽/ночь, Люкс — 2500₽/ночь, VIP — 4000₽/ночь. Всё включено!";
        }
        
        return "Мяу... Я не совсем понял вопрос. Позвоните нам: +7 (999) 123-45-67, и человек всё расскажет! Или переформулируй вопрос 🐱";
    },
    
    answer(question) {
        if (!question || question.trim() === "") return "Мяу? Напиши что-нибудь...";
        
        const localAnswer = this.getLocalAnswer(question);
        if (localAnswer) return localAnswer;
        
        return this.generateSmartAnswer(question);
    }
};

function createChatbotUI() {
    const oldCat = document.getElementById('chatbot-container');
    if (oldCat) oldCat.remove();
    
    const chatHTML = `
    <div id="chatbot-container" style="position: fixed; bottom: 20px; right: 20px; z-index: 10000;">
        <div id="chatbot-toggle" style="width: 70px; height: 70px; background: #ffb347; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.3); transition: 0.3s;">
            <span style="font-size: 40px;">🐱</span>
        </div>
        
        <div id="chatbot-window" style="display: none; position: absolute; bottom: 80px; right: 0; width: 340px; height: 480px; background: white; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); overflow: hidden; flex-direction: column;">
            <div style="background: #2c1810; color: #ffb347; padding: 12px 15px; text-align: center; font-weight: bold;">
                🐾 Кот-помощник Мурзик 🐾
                <span id="chatbot-close" style="float: right; cursor: pointer;">✕</span>
            </div>
            <div id="chatbot-messages" style="flex: 1; padding: 12px; overflow-y: auto; background: #fef7e8; min-height: 350px; max-height: 380px;">
                <div style="background: #ffe0b5; padding: 10px 14px; border-radius: 18px; margin: 5px 0; display: inline-block; max-width: 85%;">
                    🐱 ${catBot.welcome}
                </div>
            </div>
            <div style="padding: 12px; border-top: 1px solid #ffd6a5; display: flex; gap: 8px; background: white;">
                <input type="text" id="chatbot-input" placeholder="Спроси меня..." style="flex: 1; padding: 10px; border-radius: 25px; border: 1px solid #ffd6a5; font-size: 14px;">
                <button id="chatbot-send" style="background: #ffb347; border: none; border-radius: 50%; width: 42px; height: 42px; cursor: pointer; font-size: 18px;">➤</button>
            </div>
        </div>
    </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', chatHTML);
    
    const toggle = document.getElementById('chatbot-toggle');
    const windowEl = document.getElementById('chatbot-window');
    const closeBtn = document.getElementById('chatbot-close');
    const sendBtn = document.getElementById('chatbot-send');
    const input = document.getElementById('chatbot-input');
    const messages = document.getElementById('chatbot-messages');
    
    if (toggle) {
        toggle.onclick = () => {
            if (windowEl) windowEl.style.display = windowEl.style.display === 'none' ? 'flex' : 'none';
        };
    }
    
    if (closeBtn) {
        closeBtn.onclick = () => {
            if (windowEl) windowEl.style.display = 'none';
        };
    }
    
    function sendMessage() {
        const text = input.value.trim();
        if (!text) return;
        
        messages.innerHTML += `<div style="text-align: right; margin: 5px 0;"><div style="background: #ffb347; color: white; padding: 8px 14px; border-radius: 18px; display: inline-block; max-width: 85%;">😺 ${escapeHtml(text)}</div></div>`;
        
        const answer = catBot.answer(text);
        setTimeout(() => {
            messages.innerHTML += `<div style="margin: 5px 0;"><div style="background: #ffe0b5; padding: 8px 14px; border-radius: 18px; display: inline-block; max-width: 85%;">🐱 ${escapeHtml(answer)}</div></div>`;
            messages.scrollTop = messages.scrollHeight;
        }, 200);
        
        input.value = '';
        messages.scrollTop = messages.scrollHeight;
    }
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    if (sendBtn) sendBtn.onclick = sendMessage;
    if (input) input.onkeypress = (e) => { if (e.key === 'Enter') sendMessage(); };
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createChatbotUI);
} else {
    createChatbotUI();
}