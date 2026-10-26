"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const $ = selector => document.querySelector(selector);
    const $$ = selector => document.querySelectorAll(selector);

  
    const baseMeals = [
        { id: "oatmeal", name: "Protein Oatmeal with Banana", cat: "breakfast", calories: 350, protein: 25, desc: "A tasty, energy-rich meal with 25g of protein.", img: "protein-oatmeal-banana.jpg" },
        { id: "chicken", name: "Grilled Chicken & Rice", cat: "post-workout", calories: 520, protein: 45, desc: "Helps you gain mass and build muscle.", img: "grilled-chicken-rice.jpg" },
        { id: "yogurt", name: "Greek Yogurt Shake", cat: "snack", calories: 280, protein: 30, desc: "Useful and convenient to stay full during the day.", img: "greek-yogurt-shake.jpg" }
    ];
    const withMethods = meal => ({
        ...meal,
        summary() { return `${this.calories} kcal · ${this.protein} g protein`; },
        isHighProtein() { return this.protein >= 30; }
    });

    const dictionary = {
        en: { navHome: "Home", navSport: "Sport Food", night: "🌙 Night", day: "☀️ Day", welcome: "Welcome to our Food Craft", greetBtn: "Greet me", timeBtn: "Show current time", whyTitle: "Why choose us?", galleryTitle: "Meal Gallery", guideTitle: "Sports Nutrition Guide", all: "All", breakfast: "Breakfast", post: "Post-Workout", snack: "Snack", addBtn: "Add to my nutrition", loadMore: "Load more meals", offerBtn: "Open Special Offer", orderTitle: "Custom Nutrition Order", labelName: "Your Name:", labelEmail: "Your Email:", labelGoal: "Fitness Goal:", next: "Next", back: "Back", send: "Send Request", reset: "Reset", faqTitle: "Frequently Asked Questions (FAQ)", filterTitle: "Filter by Goal", nutritionTitle: "My Nutrition", clearBtn: "Clear all", total: "Total", morning: "Good morning", afternoon: "Good afternoon", evening: "Good evening", ready: "Ready to eat smart?", step: "Step", of: "of", empty: "Nothing added yet.", high: "High protein" },
        ru: { navHome: "Главная", navSport: "Спортпитание", night: "🌙 Ночь", day: "☀️ День", welcome: "Добро пожаловать в Food Craft", greetBtn: "Поприветствуй", timeBtn: "Показать время", whyTitle: "Почему мы?", galleryTitle: "Галерея блюд", guideTitle: "Гид по спортивному питанию", all: "Все", breakfast: "Завтрак", post: "После тренировки", snack: "Перекус", addBtn: "Добавить в мой рацион", loadMore: "Загрузить ещё блюда", offerBtn: "Открыть спецпредложение", orderTitle: "Индивидуальный заказ питания", labelName: "Ваше имя:", labelEmail: "Ваш email:", labelGoal: "Цель:", next: "Далее", back: "Назад", send: "Отправить заявку", reset: "Сбросить", faqTitle: "Частые вопросы (FAQ)", filterTitle: "Фильтр по цели", nutritionTitle: "Мой рацион", clearBtn: "Очистить", total: "Итого", morning: "Доброе утро", afternoon: "Добрый день", evening: "Добрый вечер", ready: "Готовы питаться разумно?", step: "Шаг", of: "из", empty: "Пока ничего не добавлено.", high: "Много белка" },
        kk: { navHome: "Басты бет", navSport: "Спорт тағамы", night: "🌙 Түн", day: "☀️ Күн", welcome: "Food Craft сайтына қош келдіңіз", greetBtn: "Сәлемдес", timeBtn: "Уақытты көрсету", whyTitle: "Неге бізді таңдау керек?", galleryTitle: "Тағам галереясы", guideTitle: "Спорттық тамақтану нұсқаулығы", all: "Барлығы", breakfast: "Таңғы ас", post: "Жаттығудан кейін", snack: "Жеңіл тамақ", addBtn: "Рационыма қосу", loadMore: "Тағы тағам жүктеу", offerBtn: "Арнайы ұсынысты ашу", orderTitle: "Жеке тамақтану тапсырысы", labelName: "Атыңыз:", labelEmail: "Электрондық пошта:", labelGoal: "Мақсат:", next: "Келесі", back: "Артқа", send: "Өтініш жіберу", reset: "Тазалау", faqTitle: "Жиі қойылатын сұрақтар (FAQ)", filterTitle: "Мақсат бойынша сүзгі", nutritionTitle: "Менің рационым", clearBtn: "Тазалау", total: "Барлығы", morning: "Қайырлы таң", afternoon: "Қайырлы күн", evening: "Қайырлы кеш", ready: "Дұрыс тамақтануға дайынсыз ба?", step: "Қадам", of: "/", empty: "Әзірге ештеңе қосылмаған.", high: "Ақуыз көп" }
    };

    
    Object.assign(dictionary.ru, {"tagline": "На нашем сайте вы можете выбрать спортивные и повседневные блюда с калориями.", "li1": "Легко следить за калориями", "li2": "Интерактивный конструктор блюд и рационов", "li3": "Свежие ингредиенты и полезные советы", "galleryH3": "С этими блюдами вы станете здоровее и сильнее", "guideIntro": "Выберите блюда для максимальной эффективности тренировок:", "thMeal": "Блюдо", "thCal": "Калории (ккал)", "thProt": "Белок (г)", "thBest": "Подходит для", "best1": "Завтрак перед тренировкой", "best2": "Набор мышц после тренировки", "best3": "Быстрое восстановление", "labelNotes": "Пожелания или аллергии:", "popTitle": "Специальная скидка!", "popText": "Получите скидку 20% на первый индивидуальный заказ питания при подписке сегодня.", "close": "Закрыть", "goalNote": "Выберите цель, чтобы узнать больше!", "gMuscle": "Набор массы", "gWeight": "Похудение", "gEndurance": "Выносливость", "q1": "Что входит в индивидуальный заказ питания?", "a1": "Индивидуальный план включает расчёт макронутриентов, расписание приёмов пищи под вашу цель и дневную норму калорий.", "q2": "Как отслеживать калории в Food Craft?", "a2": "Добавляйте блюда в «Мой рацион» на странице спортпитания, и итоги посчитаются автоматически.", "q3": "Можно ли позже изменить цель?", "a3": "Да, вы можете обновить предпочтения и цель в любое время, заполнив форму заказа заново.", "mT": "О наборе мышечной массы", "mX": "Для набора мышц нужен профицит калорий, 1,6–2,2 г белка на кг веса и силовые тренировки с прогрессией нагрузки.", "wT": "О похудении", "wX": "Для похудения нужен устойчивый дефицит калорий, много клетчатки из овощей и цельных злаков и достаточно воды.", "eT": "О выносливости", "eX": "Для выносливости нужны сложные углеводы для гликогена, баланс электролитов и правильное питание после тренировки."});
    Object.assign(dictionary.kk, {"tagline": "Сайтымызда калориясы бар спорттық және күнделікті тағамдарды таңдай аласыз.", "li1": "Калорияны бақылау оңай", "li2": "Интерактивті тағам және рацион құрастырушы", "li3": "Жаңа ингредиенттер және пайдалы кеңестер", "galleryH3": "Осы тағамдармен сіз сау әрі күшті боласыз", "guideIntro": "Жаттығу тиімділігін арттыру үшін ұсынылған тағамдарды қараңыз:", "thMeal": "Тағам", "thCal": "Калория (ккал)", "thProt": "Ақуыз (г)", "thBest": "Қашан қолайлы", "best1": "Жаттығу алдындағы таңғы ас", "best2": "Жаттығудан кейін бұлшықет жинау", "best3": "Жылдам қалпына келу", "labelNotes": "Тілектер немесе аллергия:", "popTitle": "Арнайы жеңілдік!", "popText": "Бүгін жазылсаңыз, алғашқы жеке тамақтану тапсырысына 20% жеңілдік аласыз.", "close": "Жабу", "goalNote": "Көбірек білу үшін мақсатты таңдаңыз!", "gMuscle": "Бұлшықет жинау", "gWeight": "Арықтау", "gEndurance": "Төзімділік", "q1": "Жеке тамақтану тапсырысына не кіреді?", "a1": "Жеке жоспарға макронутриенттер есебі, мақсатыңызға сай тамақтану кестесі және күнделікті калория нормасы кіреді.", "q2": "Food Craft-та калорияны қалай бақылауға болады?", "a2": "Спорт тағамы бетіндегі «Менің рационым» бөліміне тағамдарды қосыңыз, қорытынды автоматты есептеледі.", "q3": "Мақсатты кейін өзгертуге бола ма?", "a3": "Иә, тапсырыс формасын қайта толтырып, қалауыңыз бен мақсатыңызды кез келген уақытта жаңарта аласыз.", "mT": "Бұлшықет жинау туралы", "mX": "Бұлшықет жинау үшін калория профициті, дене салмағының әр кг-на 1,6–2,2 г ақуыз және жүктемені арттыратын күш жаттығулары қажет.", "wT": "Арықтау туралы", "wX": "Арықтау үшін тұрақты калория тапшылығы, көкөніс пен тұтас дәнді дақылдардан көп талшық және жеткілікті су қажет.", "eT": "Төзімділік туралы", "eX": "Төзімділік үшін гликогенге арналған күрделі көмірсулар, электролит балансы және жаттығудан кейінгі дұрыс тамақтану қажет."});
    Object.assign(dictionary.en, {"mT": "Muscle Gain Insights", "mX": "To build quality muscle mass, consume a calorie surplus with 1.6–2.2g of protein per kilogram of body weight, combined with progressive overload resistance training.", "wT": "Weight Loss Insights", "wX": "Effective weight loss requires a sustainable calorie deficit, high fiber intake from vegetables and whole grains, and adequate hydration to boost metabolism.", "eT": "Endurance Insights", "eX": "Endurance training demands complex carbohydrates for sustained glycogen storage, electrolyte balance, and proper post-workout recovery nutrition."});

    let lang = localStorage.getItem("siteLang") || "en";
    let meals = baseMeals.map(withMethods);
    let currentCat = "all";
    let currentStep = 0;
    let shownCalories = 0;
    let myMeals = [];
    try { myMeals = JSON.parse(localStorage.getItem("myMeals")) || []; } catch (e) { myMeals = []; }

    const themeBtn = $("#theme-btn");
    const langSelect = $("#langSelect");
    const greeting = document.getElementById("greeting");
    const mealGrid = $("#mealGrid");
    const nutritionList = $("#nutritionList");
    const steps = [...$$(".form-step")];
    const orderForm = $("#orderForm");
    const formMsg = $("#formMsg");

    const t = key => dictionary[lang][key] || dictionary.en[key];


    const sounds = { click: new Audio("sounds/click.wav"), add: new Audio("sounds/add.wav"), success: new Audio("sounds/success.wav") };
    function playSound(name) {
        const sound = sounds[name];
        sound.pause();
        sound.currentTime = 0;
        sound.play().catch(() => { });
    }

 
    function timeGreeting() {
        const hour = new Date().getHours();
        switch (true) {
            case hour < 12: return t("morning");
            case hour < 18: return t("afternoon");
            default:        return t("evening");
        }
    }
 
    function getFilter(cat) {
        switch (cat) {
            case "breakfast":
            case "post-workout":
            case "snack":
                return meal => meal.cat === cat;
            default:
                return () => true;
        }
    }

    function setLanguage(code) {
        switch (code) {
            case "ru": lang = "ru"; break;
            case "kk": lang = "kk"; break;
            default:   lang = "en";
        }
        localStorage.setItem("siteLang", lang);
        applyLanguage();
    }

    function applyLanguage() {
        document.documentElement.lang = lang;
        if (langSelect) langSelect.value = lang;
        $$("[data-i18n]").forEach(el => {
            if (!el.dataset.en) el.dataset.en = el.textContent; 
            el.textContent = dictionary[lang][el.dataset.i18n] || el.dataset.en;
        });
        refreshGoal();
        updateThemeLabel();
        showGreeting();
        updateStepIndicator();
        renderMeals();
        renderNutrition();
    }
    if (langSelect) {
        langSelect.addEventListener("change", event => { setLanguage(event.target.value); playSound("click"); });
    }

    function updateThemeLabel() {
        if (themeBtn) themeBtn.innerText = document.body.classList.contains("night") ? t("day") : t("night");
    }
    if (themeBtn) {
        document.body.classList.toggle("night", localStorage.getItem("siteMode") === "night");
        themeBtn.addEventListener("click", () => {
            const isNight = document.body.classList.toggle("night");
            localStorage.setItem("siteMode", isNight ? "night" : "day");
            updateThemeLabel();
            playSound("click");
        });
    }

    function showGreeting() {
        if (!greeting) return;
    
        greeting.innerHTML = `${timeGreeting()}, <strong></strong>! ${t("ready")}`;
        greeting.querySelector("strong").textContent = localStorage.getItem("visitorName") || "Guest";
    }
    const nameForm = $("#nameForm");
    if (nameForm) {
        nameForm.addEventListener("submit", event => {
            event.preventDefault();
            const nameInput = $("#nameInput");
            if (!/\p{L}/u.test(nameInput.value)) { nameInput.classList.add("invalid"); return; } 
            nameInput.classList.remove("invalid");
            localStorage.setItem("visitorName", nameInput.value.trim());
            showGreeting();
            nameForm.reset();
            playSound("success");
        });
    }

   
    const colorPicker = $("#fav-color");
    const themedElements = [document.getElementById("main-header"), document.getElementsByTagName("footer")[0]];
    function applyThemeColor(color) { themedElements.forEach(el => { if (el) el.style.backgroundColor = color; }); }
    const savedColor = localStorage.getItem("siteThemeColor");
    if (savedColor) { applyThemeColor(savedColor); if (colorPicker) colorPicker.value = savedColor; }
    if (colorPicker) {
        colorPicker.addEventListener("input", () => {
            applyThemeColor(colorPicker.value);
            localStorage.setItem("siteThemeColor", colorPicker.value);
        });
    }

  
    const timeBtn = $("#timeBtn");
    if (timeBtn) {
        timeBtn.addEventListener("click", () => {
            $("#timeOut").textContent = new Date().toLocaleTimeString();
            playSound("click");
        });
    }
    const dateElement = $("#clock-date");
    const timeElement = $("#clock-time");
    function updateClock() {
        const now = new Date();
        dateElement.textContent = now.toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" });
        timeElement.textContent = now.toLocaleTimeString("en-US");
    }
    if (dateElement && timeElement) { updateClock(); setInterval(updateClock, 1000); }


    const menu = $("nav");
    menu.addEventListener("keydown", event => {
        const items = [...menu.querySelectorAll("a, .theme-btn")];
        const index = items.indexOf(document.activeElement);
        if (index === -1) return; 
        switch (event.key) {
            case "ArrowRight":
            case "ArrowDown":
                items[(index + 1) % items.length].focus(); event.preventDefault(); break;
            case "ArrowLeft":
            case "ArrowUp":
                items[(index - 1 + items.length) % items.length].focus(); event.preventDefault(); break;
            case "Home": items[0].focus(); event.preventDefault(); break;
            case "End":  items[items.length - 1].focus(); event.preventDefault(); break;
        }
    });

    function initRating(box) {
        const stars = box.querySelectorAll(".star");
        const text = box.nextElementSibling;
        const key = "rating-" + box.dataset.meal;
        function paint(value) {
            stars.forEach(star => star.classList.toggle("selected", Number(star.dataset.value) <= value));
            text.textContent = value ? `Your rating: ${value} / 5` : "Not rated yet";
        }
        paint(Number(localStorage.getItem(key)) || 0);
        stars.forEach(star => star.addEventListener("click", () => {
            localStorage.setItem(key, star.dataset.value);
            paint(Number(star.dataset.value));
            playSound("click");
        }));
    }

    function createCard(meal) {
        const card = document.createElement("div");
        card.className = "card";
        const starsHtml = [1, 2, 3, 4, 5].map(n => `<span class="star" data-value="${n}" role="button" aria-label="${n} star">★</span>`).join("");
        card.innerHTML = `<h3></h3><img alt=""><p></p><span class="meal-macros"></span>
            <div class="rating" data-meal="${meal.id}">${starsHtml}</div><span class="rating-text"></span>
            <button type="button" class="submit-btn add-btn"></button>`;
        card.querySelector("h3").textContent = meal.name;
        card.querySelector("img").setAttribute("src", "images/" + meal.img);
        card.querySelector("img").setAttribute("alt", meal.name);
        card.querySelector("p").textContent = meal.desc;
        card.querySelector(".meal-macros").textContent = meal.summary();
        if (meal.isHighProtein()) {
            const badge = document.createElement("span");
            badge.className = "badge";
            badge.textContent = "💪 " + t("high");
            card.querySelector(".meal-macros").appendChild(badge);
        }
        card.querySelector(".add-btn").textContent = t("addBtn");
        card.querySelector(".add-btn").addEventListener("click", () => addToNutrition(meal, card));
        initRating(card.querySelector(".rating"));
        return card;
    }

    function renderMeals() {
        if (!mealGrid) return;
        mealGrid.innerHTML = "";
        for (const meal of meals.filter(getFilter(currentCat))) {
            mealGrid.appendChild(createCard(meal));
        }
    }
    const filterButtons = [...document.getElementsByClassName("meal-filter")];
    filterButtons.forEach(button => {
        button.addEventListener("click", () => {
            currentCat = button.dataset.cat;
            filterButtons.forEach(b => b.classList.toggle("active", b === button));
            renderMeals();
            playSound("click");
        });
    });

    const loadMoreBtn = $("#loadMoreBtn");
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener("click", async () => {
            const msg = $("#loadMsg");
            try {
                const response = await fetch("data/meals.json");
                if (!response.ok) throw new Error("HTTP " + response.status);
                const extra = await response.json();
                meals = meals.concat(extra.map(withMethods));
                renderMeals();
                msg.className = "load-msg ok";
                msg.textContent = `Loaded ${extra.length} more meals!`;
                loadMoreBtn.disabled = true;
                playSound("success");
            } catch (error) {
                msg.className = "load-msg err";
                msg.textContent = "Could not load meals. Open the site via GitHub Pages or Live Server.";
            }
        });
    }


    function addToNutrition(meal, card) {
        myMeals.push({ name: meal.name, calories: meal.calories, protein: meal.protein });
        card.classList.add("added");
        card.addEventListener("animationend", () => card.classList.remove("added"), { once: true });
        playSound("add");
        renderNutrition();
    }

    function animateNumber(element, target) {
        const start = shownCalories;
        const startTime = performance.now();
        function frame(now) {
            const progress = Math.min((now - startTime) / 600, 1);
            shownCalories = Math.round(start + (target - start) * progress);
            element.textContent = shownCalories;
            if (progress < 1) requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
    }

    function renderNutrition() {
        if (!nutritionList) return;
        nutritionList.innerHTML = "";
        if (myMeals.length === 0) {
            const empty = document.createElement("li");
            empty.textContent = t("empty");
            nutritionList.appendChild(empty);
        }
        myMeals.forEach((item, index) => {
            const li = document.createElement("li");
            li.innerHTML = '<span></span><button type="button" class="remove-btn" aria-label="Remove">✕</button>';
            li.firstElementChild.textContent = `${item.name} (${item.calories} kcal)`;
            li.querySelector(".remove-btn").addEventListener("click", () => {
                myMeals.splice(index, 1);
                playSound("click");
                renderNutrition();
            });
            nutritionList.appendChild(li);
        });
        const totalCalories = myMeals.reduce((sum, item) => sum + item.calories, 0);
        const totalProtein = myMeals.reduce((sum, item) => sum + item.protein, 0);
        animateNumber($("#totalCalories"), totalCalories);
        $("#totalProtein").textContent = totalProtein;
        $("#calorieBar").style.width = Math.min(totalCalories / 2500 * 100, 100) + "%"; 
        localStorage.setItem("myMeals", JSON.stringify(myMeals));
    }
    const clearBtn = $("#clearNutritionBtn");
    if (clearBtn) clearBtn.addEventListener("click", () => { myMeals = []; renderNutrition(); playSound("click"); });

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    function markField(field, isOk) { field.classList.toggle("invalid", !isOk); return isOk; }

    function isValidName(value) {
        const name = value.trim();
        return name !== "" && /\p{L}/u.test(name);
    }
    function validateIdentity() {
        const nameField = $("#username");
        const nameOk = markField(nameField, isValidName(nameField.value));
        const emailOk = markField($("#email"), emailPattern.test($("#email").value.trim()));
        formMsg.className = nameOk ? "" : "err";
        formMsg.textContent = nameOk ? "" : "Name must contain letters, not only digits.";
        return nameOk && emailOk;
    }
    function updateStepIndicator() {
        const indicator = $("#stepIndicator");
        if (indicator) indicator.textContent = `${t("step")} ${currentStep + 1} ${t("of")} ${steps.length}`;
    }

    function showStep(index) {
        steps.forEach((step, i) => step.classList.toggle("hidden", i !== index));
        $("#backBtn").disabled = index === 0;
        $("#nextBtn").classList.toggle("hidden", index === steps.length - 1);
        $("#sendBtn").classList.toggle("hidden", index !== steps.length - 1);
        updateStepIndicator();
    }
   
    function goToStep(direction, callback) {
        if (direction > 0 && currentStep === 0 && !validateIdentity()) return;
        currentStep = Math.min(Math.max(currentStep + direction, 0), steps.length - 1);
        callback(currentStep);
    }
    function resetForm() {
        orderForm.querySelectorAll("input, textarea").forEach(input => { input.value = ""; input.classList.remove("invalid"); });
        orderForm.querySelector("select").selectedIndex = 0;
        currentStep = 0;
        showStep(0);
    }
   
    function sendOrder(data, onSuccess, onError) {
        fetch("https://jsonplaceholder.typicode.com/posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        })
            .then(response => { if (!response.ok) throw new Error("HTTP " + response.status); return response.json(); })
            .then(onSuccess)
            .catch(onError);
    }
    if (orderForm) {
        $("#nextBtn").addEventListener("click", () => { goToStep(1, showStep); playSound("click"); });
        $("#backBtn").addEventListener("click", () => { goToStep(-1, showStep); playSound("click"); });
        $("#resetBtn").addEventListener("click", () => { resetForm(); formMsg.textContent = ""; playSound("click"); });
        orderForm.addEventListener("submit", event => {
            event.preventDefault();
            if (!validateIdentity()) { currentStep = 0; showStep(0); return; }
            const data = Object.fromEntries(new FormData(orderForm));
            formMsg.className = "";
            formMsg.textContent = "Sending...";
            sendOrder(data,
                () => {
                    resetForm();
                    formMsg.className = "ok";
                    formMsg.textContent = `Thank you, ${data.username}! Your request was sent successfully.`;
                    playSound("success");
                },
                () => {
                    formMsg.className = "err";
                    formMsg.textContent = "Sending failed. Please check your connection and try again.";
                });
        });
        showStep(0);
    }

   
    const accordionHeaders = [...$$(".accordion-header")];
    accordionHeaders.forEach((header, index) => {
        header.addEventListener("click", () => {
            const body = header.nextElementSibling;
            const wasHidden = body.classList.contains("hidden");
            accordionHeaders.forEach(h => h.nextElementSibling.classList.add("hidden"));
            body.classList.toggle("hidden", !wasHidden);
            playSound("click");
        });
        header.addEventListener("keydown", event => {
            switch (event.key) {
                case "ArrowDown": accordionHeaders[(index + 1) % accordionHeaders.length].focus(); event.preventDefault(); break;
                case "ArrowUp":   accordionHeaders[(index - 1 + accordionHeaders.length) % accordionHeaders.length].focus(); event.preventDefault(); break;
            }
        });
    });

   
    const goalKeys = { muscle: ["mT", "mX"], weight: ["wT", "wX"], endurance: ["eT", "eX"] };
    let activeGoalKey = null;
    function fillGoal(key) {
        $("#goal-title").textContent = t(goalKeys[key][0]);
        $("#goal-text").textContent = t(goalKeys[key][1]);
    }
    function refreshGoal() { if (activeGoalKey) fillGoal(activeGoalKey); }
    const goalInfoBox = $("#goal-info-box");
    $$(".goal-btn").forEach(button => {
        button.addEventListener("click", () => {
            const key = button.dataset.goal;
            if (activeGoalKey === key) {
                goalInfoBox.classList.add("hidden");
                activeGoalKey = null;
            } else {
                fillGoal(key);
                goalInfoBox.classList.remove("hidden");
                activeGoalKey = key;
            }
            playSound("click");
        });
    });

    const popup = $("#customPopup");
    if (popup) {
        $("#openPopupBtn").addEventListener("click", () => { popup.classList.remove("hidden"); playSound("click"); });
        $("#closePopupBtn").addEventListener("click", () => popup.classList.add("hidden"));
        popup.addEventListener("click", event => { if (event.target === popup) popup.classList.add("hidden"); });
        document.addEventListener("keydown", event => {
            switch (event.key) {
                case "Escape": popup.classList.add("hidden"); break;
            }
        });
    }

    applyLanguage();
});
