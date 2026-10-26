document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       SOUND EFFECTS (Assignment 5)
       Short tones are generated with the Web Audio API, so no audio
       files are needed. Only ONE tone plays at a time: a new sound
       stops the previous one, so sounds never overlap.
       ===================================================== */
    const soundPresets = {
        click:   { freq: 520, duration: 0.08 },
        star:    { freq: 760, duration: 0.15 },
        success: { freq: 880, duration: 0.25 },
        error:   { freq: 220, duration: 0.25 }
    };
    let audioContext = null;
    let currentTone = null;

    function playSound(type) {
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) return;
            if (!audioContext) audioContext = new AudioContextClass();
            if (audioContext.state === "suspended") audioContext.resume();

            if (currentTone) {                       // stop previous tone -> no overlap
                try { currentTone.stop(); } catch (e) { /* already stopped */ }
            }

            const preset = soundPresets[type] || soundPresets.click;
            const oscillator = audioContext.createOscillator();
            const gain = audioContext.createGain();
            const now = audioContext.currentTime;

            oscillator.type = "sine";
            oscillator.frequency.value = preset.freq;
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + preset.duration);

            oscillator.connect(gain);
            gain.connect(audioContext.destination);
            oscillator.start(now);
            oscillator.stop(now + preset.duration);
            currentTone = oscillator;
        } catch (e) { /* audio not supported - ignore */ }
    }

    // One delegated listener: every button / button-like link plays a click sound
    document.addEventListener("click", function (event) {
        const target = event.target.closest("button, .btn");
        if (target && !target.classList.contains("star")) playSound("click");
    });

    /* =====================================================
       TASK 4. Change background color (button + color picker)
       Colors are saved, so they stay the same on every page.
       ===================================================== */
    const colorPicker = document.getElementById("bg-color-picker");
    const colorButton = document.getElementById("bg-color-btn");
    const palette = ["#f5f7f2", "#e8f3e1", "#fdf3e1", "#e6f0f7", "#f6e8ef", "#eceaf7"];
    let colorIndex = 0;

    function applyColor(color) {
        document.body.style.backgroundColor = color;
        if (colorPicker) colorPicker.value = color;
        try { localStorage.setItem("fc-bg-color", color); } catch (e) { /* storage unavailable */ }
    }

    try {
        const saved = localStorage.getItem("fc-bg-color");
        if (saved) {
            document.body.style.backgroundColor = saved;
            if (colorPicker) colorPicker.value = saved;
            const savedIndex = palette.indexOf(saved);
            if (savedIndex !== -1) colorIndex = savedIndex;
        }
    } catch (e) { /* storage unavailable */ }

    if (colorButton) {
        colorButton.addEventListener("click", function () {
            colorIndex = (colorIndex + 1) % palette.length;
            applyColor(palette[colorIndex]);
        });
    }

    if (colorPicker) {
        colorPicker.addEventListener("input", function () {
            applyColor(colorPicker.value);
        });
    }

    /* =====================================================
       KEYBOARD NAVIGATION for the navigation menu
       Arrow keys / Home / End move focus between menu items.
       ===================================================== */
    const navItems = Array.from(document.querySelectorAll(".navbar-brand, #mainNav .nav-link"));

    document.addEventListener("keydown", function (event) {
        const current = navItems.indexOf(document.activeElement);
        if (current === -1) return;                       // focus is not in the menu

        let next;
        switch (event.key) {
            case "ArrowRight":
            case "ArrowDown":
                next = (current + 1) % navItems.length;
                break;
            case "ArrowLeft":
            case "ArrowUp":
                next = (current - 1 + navItems.length) % navItems.length;
                break;
            case "Home":
                next = 0;
                break;
            case "End":
                next = navItems.length - 1;
                break;
            default:
                return;                                   // other keys: do nothing
        }
        event.preventDefault();
        navItems[next].focus();
    });

    /* =====================================================
       RECIPES PAGE: star rating, filter (switch), load more (fetch)
       Everything below runs only if the recipe list exists.
       ===================================================== */
    const recipeList = document.getElementById("recipe-list");
    const recipeCount = document.getElementById("recipe-count");
    const noRecipesMessage = document.getElementById("no-recipes");
    const filterButtons = document.querySelectorAll("[data-filter]");
    let currentFilter = "all";

    /* ---------- Star rating ---------- */
    const ratingLabels = ["Not for me", "Okay", "Good", "Very good", "Excellent!"];

    // Builds the 5 stars + text for one recipe (reused for loaded cards too)
    function createRating(recipeTitle) {
        const wrapper = document.createElement("div");
        wrapper.className = "rating";
        wrapper.dataset.recipe = recipeTitle;

        for (let value = 1; value <= 5; value++) {
            const star = document.createElement("button");
            star.type = "button";
            star.className = "star";
            star.dataset.value = String(value);
            star.setAttribute("aria-label", value + " out of 5 for " + recipeTitle);
            star.textContent = "★";
            wrapper.appendChild(star);
        }

        const text = document.createElement("span");
        text.className = "rating-text";
        text.textContent = "Rate this recipe";
        wrapper.appendChild(text);
        return wrapper;
    }

    // Colors the stars up to "value" and updates the message with textContent
    function showRating(wrapper, value) {
        wrapper.querySelectorAll(".star").forEach(function (star) {
            const active = Number(star.dataset.value) <= value;
            star.classList.toggle("is-active", active);
            star.setAttribute("aria-pressed", String(active));
        });
        const text = wrapper.querySelector(".rating-text");
        text.textContent = value > 0
            ? "You rated: " + value + "/5 – " + ratingLabels[value - 1]
            : "Rate this recipe";
    }

    function initRating(wrapper) {
        const key = "fc-rating-" + wrapper.dataset.recipe;
        try {
            const savedValue = Number(localStorage.getItem(key));
            if (savedValue) showRating(wrapper, savedValue);
        } catch (e) { /* storage unavailable */ }

        wrapper.querySelectorAll(".star").forEach(function (star) {
            star.addEventListener("click", function () {
                const value = Number(star.dataset.value);
                showRating(wrapper, value);
                try { localStorage.setItem(key, String(value)); } catch (e) { /* ignore */ }

                // animation: restart the "pop" effect on the clicked star
                star.classList.remove("pop");
                void star.offsetWidth;
                star.classList.add("pop");
                playSound("star");
            });
        });
    }

    // Insert the rating block above the "Choose Meal" button of a card
    function addRatingToCard(item) {
        const title = item.querySelector(".card-title");
        const chooseButton = item.querySelector(".btn-success");
        if (!title || !chooseButton || item.querySelector(".rating")) return;

        const rating = createRating(title.textContent.trim());
        chooseButton.before(rating);
        initRating(rating);
    }

    /* ---------- Filter (switch statement) ---------- */
    function matchesCategory(selected, itemCategory) {
        switch (selected) {
            case "breakfast":
            case "lunch":
            case "dinner":
                return itemCategory === selected;
            case "all":
            default:
                return true;
        }
    }

    function applyFilter(category) {
        if (!recipeList) return;
        currentFilter = category;
        const items = Array.from(recipeList.querySelectorAll(".recipe-item"));

        // higher-order function: filter() returns only the matching recipes
        const visible = items.filter(function (item) {
            return matchesCategory(category, item.dataset.category);
        });

        items.forEach(function (item) {
            item.classList.toggle("is-hidden", !visible.includes(item));
        });

        if (recipeCount) {
            recipeCount.textContent = "Showing " + visible.length + " of " + items.length + " recipes";
        }
        if (noRecipesMessage) {
            noRecipesMessage.classList.toggle("d-none", visible.length > 0);
        }
    }

    filterButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            filterButtons.forEach(function (item) {
                item.classList.remove("active");
                item.setAttribute("aria-pressed", "false");
            });
            button.classList.add("active");
            button.setAttribute("aria-pressed", "true");
            applyFilter(button.dataset.filter);
        });
    });

    /* ---------- Load more recipes (fetch + objects/arrays) ---------- */
    const loadMoreButton = document.getElementById("load-more-btn");
    const loadStatus = document.getElementById("load-status");
    const BATCH_SIZE = 3;
    let extraRecipes = null;      // array of recipe objects from more-recipes.json
    let loadedCount = 0;

    function getExtraRecipes() {
        if (extraRecipes) return Promise.resolve(extraRecipes);
        return fetch("more-recipes.json")
            .then(function (response) {
                if (!response.ok) throw new Error("HTTP " + response.status);
                return response.json();
            })
            .then(function (data) {
                extraRecipes = data;
                return data;
            });
    }

    // Builds a card from one recipe object and appends it to the list
    function appendRecipeCard(recipe) {
        const column = document.createElement("div");
        column.className = "col-12 col-md-6 col-lg-4 recipe-item is-new";
        column.dataset.category = recipe.category;

        const ingredientsHtml = recipe.ingredients.map(function (ingredient) {
            return "<li>" + ingredient + "</li>";
        }).join("");

        column.innerHTML =
            '<article class="card fc-card h-100">' +
                '<img src="' + recipe.image + '" class="card-img-top recipe-card-img" alt="' + recipe.alt + '" loading="lazy">' +
                '<div class="card-body p-3 p-lg-4 d-flex flex-column">' +
                    '<span class="recipe-tag">' + recipe.categoryLabel + '</span>' +
                    '<h3 class="card-title mt-2">' + recipe.title + '</h3>' +
                    '<p class="card-text">' + recipe.description + '</p>' +
                    '<h4 class="h6 ingredients-title">Ingredients</h4>' +
                    '<ul class="small ps-3">' + ingredientsHtml + '</ul>' +
                    '<a href="order.html" class="btn btn-success w-100 mt-auto">Choose Meal</a>' +
                '</div>' +
            '</article>';

        // if a photo is missing, show the logo instead of a broken image
        const img = column.querySelector("img");
        img.addEventListener("error", function () { img.src = "images/foodcraft.jpg"; }, { once: true });

        recipeList.appendChild(column);
        addRatingToCard(column);
    }

    if (loadMoreButton && recipeList) {
        loadMoreButton.addEventListener("click", function () {
            loadMoreButton.disabled = true;
            if (loadStatus) loadStatus.textContent = "Loading...";

            getExtraRecipes()
                .then(function (list) {
                    const batch = list.slice(loadedCount, loadedCount + BATCH_SIZE);
                    batch.forEach(appendRecipeCard);
                    loadedCount += batch.length;
                    applyFilter(currentFilter);           // keep the active filter

                    if (loadedCount >= list.length) {
                        loadMoreButton.textContent = "All recipes loaded";
                        if (loadStatus) loadStatus.textContent = "";
                    } else {
                        loadMoreButton.disabled = false;
                        if (loadStatus) loadStatus.textContent = "Loaded " + loadedCount + " of " + list.length + " extra recipes.";
                    }
                    playSound("success");
                })
                .catch(function () {
                    loadMoreButton.disabled = false;
                    if (loadStatus) loadStatus.textContent = "Could not load recipes. Open the site through a web server (not file://) and try again.";
                    playSound("error");
                });
        });
    }

    // Initial setup for the recipes already in the HTML
    if (recipeList) {
        recipeList.querySelectorAll(".recipe-item").forEach(addRatingToCard);
        applyFilter("all");
    }

    /* =====================================================
       TEAM PAGE: "Read more" button
       Toggles the extra text with style.display and changes
       the button text with textContent.
       ===================================================== */
    document.querySelectorAll(".team-toggle").forEach(function (button) {
        const moreText = button.parentElement.querySelector(".team-more");
        if (!moreText) return;

        button.addEventListener("click", function () {
            const isHidden = moreText.style.display !== "block";
            moreText.style.display = isHidden ? "block" : "none";
            button.textContent = isHidden ? "Show less" : "Read more";
            button.setAttribute("aria-expanded", String(isHidden));
        });
    });

    /* =====================================================
       TASK 2. Accordion (FAQ) - hidden by default, toggles on click
       ===================================================== */
    document.querySelectorAll(".faq-item").forEach(function (item) {
        const button = item.querySelector(".accordion-header");
        if (!button) return;

        button.addEventListener("click", function () {
            const isOpen = item.classList.contains("is-open");
            item.classList.toggle("is-open", !isOpen);
            button.setAttribute("aria-expanded", String(!isOpen));
        });
    });

    /* =====================================================
       TASK 3. Popup subscription form
       Any element with [data-open-modal] opens the popup.
       ===================================================== */
    const modal = document.getElementById("subscription-modal");
    const openButtons = document.querySelectorAll("[data-open-modal]");
    const closeModalButton = document.getElementById("close-subscription");
    const firstModalInput = document.getElementById("subscriber-name");
    let lastOpener = null;

    function openModal(opener) {
        if (!modal) return;
        lastOpener = opener || null;
        modal.classList.add("is-visible");
        modal.setAttribute("aria-hidden", "false");
        document.body.classList.add("modal-open");
        if (firstModalInput) firstModalInput.focus();
    }

    function closeModal() {
        if (!modal) return;
        modal.classList.remove("is-visible");
        modal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("modal-open");
        if (lastOpener) lastOpener.focus();
    }

    openButtons.forEach(function (btn) {
        btn.addEventListener("click", function () { openModal(btn); });
    });

    if (closeModalButton) closeModalButton.addEventListener("click", closeModal);

    if (modal) {
        modal.addEventListener("click", function (event) {
            if (event.target === modal) closeModal();   // click outside the popup
        });
    }

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && modal && modal.classList.contains("is-visible")) {
            closeModal();
        }
    });

    /* =====================================================
       TASK 1. Form validation (live + on submit)
       + asynchronous submit with fetch and callbacks (Assignment 5)
       ===================================================== */
    const form = document.getElementById("subscription-form");

    // Sends data with fetch (POST). The result is handled by callbacks.
    // The password is NOT sent - only name and email.
    function sendSubscription(data, onSuccess, onError) {
        fetch("https://jsonplaceholder.typicode.com/posts", {
            method: "POST",
            headers: { "Content-Type": "application/json; charset=UTF-8" },
            body: JSON.stringify(data)
        })
            .then(function (response) {
                if (!response.ok) throw new Error("HTTP " + response.status);
                return response.json();
            })
            .then(onSuccess)
            .catch(onError);
    }

    if (form) {
        const nameInput = document.getElementById("subscriber-name");
        const emailInput = document.getElementById("subscriber-email");
        const passwordInput = document.getElementById("subscriber-password");
        const confirmInput = document.getElementById("subscriber-confirm");
        const formMessage = document.getElementById("form-message");
        const submitButton = form.querySelector('button[type="submit"]');

        const rules = [
            { input: nameInput,     error: "Please enter your name.",
              test: function () { return nameInput.value.trim().length > 0; } },
            { input: emailInput,    error: "Please enter a valid email address (e.g. name@example.com).",
              test: function () { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim()); } },
            { input: passwordInput, error: "Password must contain at least 8 characters.",
              test: function () { return passwordInput.value.length >= 8; } },
            { input: confirmInput,  error: "Passwords do not match.",
              test: function () { return confirmInput.value.length > 0 && confirmInput.value === passwordInput.value; } }
        ].filter(function (r) { return r.input; });

        function setMessage(text, type) {
            if (!formMessage) return;
            formMessage.textContent = text;
            formMessage.className = "form-message" + (type ? " " + type : "");
        }

        function validateRule(rule) {
            const ok = rule.test();
            rule.input.classList.toggle("is-invalid", !ok);
            rule.input.classList.toggle("is-valid", ok);
            const feedback = rule.input.parentElement.querySelector(".invalid-feedback");
            if (feedback) feedback.textContent = rule.error;
            return ok;
        }

        rules.forEach(function (rule) {
            rule.input.addEventListener("input", function () {
                validateRule(rule);
                // when the password changes, re-check the confirmation too
                if (rule.input === passwordInput && confirmInput.value.length > 0) {
                    validateRule(rules[rules.length - 1]);
                }
                setMessage("", "");
            });
            rule.input.addEventListener("blur", function () { validateRule(rule); });
        });

        form.addEventListener("submit", function (event) {
            event.preventDefault();

            let allValid = true;
            rules.forEach(function (rule) {
                if (!validateRule(rule)) allValid = false;
            });

            if (!allValid) {
                setMessage("Please correct the highlighted fields and try again.", "error");
                playSound("error");
                return;
            }

            // Callback: runs when the server answered successfully
            function handleSuccess() {
                setMessage("Success! Thank you for subscribing to Food Craft.", "success");
                form.reset();
                rules.forEach(function (rule) {
                    rule.input.classList.remove("is-valid", "is-invalid");
                });
                if (submitButton) submitButton.disabled = false;
                playSound("success");
            }

            // Callback: runs when the request failed
            function handleError() {
                setMessage("Could not send the form. Check your connection and try again.", "error");
                if (submitButton) submitButton.disabled = false;
                playSound("error");
            }

            setMessage("Sending...", "");
            if (submitButton) submitButton.disabled = true;
            sendSubscription(
                { name: nameInput.value.trim(), email: emailInput.value.trim() },
                handleSuccess,
                handleError
            );
        });
    }

    /* =====================================================
       TASK 5. Greeting (switch) + current date and time
       Updates every second. Example: "Good evening! October 18, 2026, 10:45:12 PM"
       ===================================================== */
    const dateTimeDisplay = document.getElementById("datetime-display");

    // Different greeting depending on the time of day
    function getGreeting(hour) {
        switch (true) {
            case hour < 12:
                return "Good morning";
            case hour < 18:
                return "Good afternoon";
            default:
                return "Good evening";
        }
    }

    function updateDateTime() {
        if (!dateTimeDisplay) return;
        const now = new Date();
        const datePart = now.toLocaleDateString("en-US", {
            year: "numeric", month: "long", day: "numeric"
        });
        const timePart = now.toLocaleTimeString("en-US", {
            hour: "numeric", minute: "2-digit", second: "2-digit"
        });
        dateTimeDisplay.textContent = getGreeting(now.getHours()) + "! " + datePart + ", " + timePart;
    }

    updateDateTime();
    window.setInterval(updateDateTime, 1000);
    /* =====================================================
       HELPERS for the Builder and Order pages
       ===================================================== */
    function popAnimation(element) {          // restart the CSS "pop" animation
        element.classList.remove("pop-anim");
        void element.offsetWidth;
        element.classList.add("pop-anim");
    }
    // The global click handler above plays "click" after a button's own handler,
    // so success/error tones are played one tick later to be the last (and only) sound.
    function playAfterClick(type) {
        window.setTimeout(function () { playSound(type); }, 0);
    }

    if (document.getElementById('buildForm')) {
    const $ = (id) => document.getElementById(id);
    const BASES = {
        rice:   { name: 'Brown Rice Bowl',    kcal: 140, price: 600 },
        quinoa: { name: 'Quinoa Mix',         kcal: 120, price: 700 },
        pasta:  { name: 'Whole Wheat Pasta',  kcal: 170, price: 650 },
        greens: { name: 'Fresh Salad Greens', kcal: 40,  price: 450 }
    };
    const TOPPINGS = [
        { id: 'chicken', name: 'Grilled Chicken', kcal: 165, price: 900 },
        { id: 'avocado', name: 'Avocado',         kcal: 120, price: 500 },
        { id: 'egg',     name: 'Boiled Egg',      kcal: 78,  price: 250 },
        { id: 'sauce',   name: 'Olive Oil Sauce', kcal: 90,  price: 300 }
    ];
    const BOWL_KCAL = { 'Double Cheese Burger Bowl': 780, 'Pepperoni Pizza Bowl': 720, 'Crispy Chicken & Fries': 690 };

    const state = { base: 'rice', toppings: new Set(), bowl: null, step: 1 };
    const form = $('buildForm');
    const steps = [...form.querySelectorAll('.form-step')];

    function describeBase(key) {
        switch (key) {
            case 'rice': return 'Filling and rich in fiber.';
            case 'quinoa': return 'Complete plant protein.';
            case 'pasta': return 'Slow carbs for lasting energy.';
            case 'greens': return 'Light, low-calorie choice.';
            default: return '';
        }
    }

    function render() {
        let name, kcal, price;
        if (state.bowl) {
            ({ name, kcal, price } = state.bowl);
        } else {
            const chosen = TOPPINGS.filter((t) => state.toppings.has(t.id));   // filter
            const items = [BASES[state.base], ...chosen];
            name = items.map((i) => i.name).join(' + ');                       // map
            kcal = items.reduce((sum, i) => sum + i.kcal, 0);                  // reduce
            price = items.reduce((sum, i) => sum + i.price, 0);
        }
        $('sum-name').textContent = name;
        $('sum-desc').textContent = state.bowl ? 'Popular combo selected.' : describeBase(state.base);
        $('sum-kcal').textContent = kcal;
        $('sum-price').textContent = price.toLocaleString('ru-RU');
        popAnimation($('bowl-summary'));
    }

    const toppingBox = $('toppings');
    TOPPINGS.forEach((t) => {
        const label = document.createElement('label');
        label.className = 'topping';
        label.innerHTML = `<input type="checkbox" value="${t.id}"> ${t.name} <small>${t.kcal} kcal · ${t.price} ₸</small>`;
        toppingBox.appendChild(label);
    });
    toppingBox.addEventListener('change', (e) => {
        e.target.checked ? state.toppings.add(e.target.value) : state.toppings.delete(e.target.value);
        state.bowl = null;
        playSound('star');
        render();
    });

    $('meal-base').addEventListener('change', (e) => {
        state.base = e.target.value;
        state.bowl = null;
        playSound('click');
        render();
    });

    // Quick Select buttons: read data from the card with DOM selectors
    document.querySelectorAll('#popular-bowls .card').forEach((card) => {
        card.querySelector('button').addEventListener('click', () => {
            const name = card.querySelector('.card-title').textContent.trim();
            const price = parseInt(card.querySelector('.price').textContent.replace(/\D/g, ''), 10);
            state.bowl = { name, price, kcal: BOWL_KCAL[name] || 0 };
            playAfterClick('success');
            render();
            $('bowl-summary').scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    });

    const greeting = $('builder-greeting');
    const defaultGreeting = 'Welcome! Enter your name to personalize your bowl.';
    $('builder-name').addEventListener('input', (e) => {
        const n = e.target.value.trim();
        greeting.textContent = n ? `Hello, ${n}! Let's build your bowl.` : defaultGreeting;
    });
    const tag = $('tag-preview');
    $('packaging-color').addEventListener('input', (e) => { tag.style.backgroundColor = e.target.value; });
    tag.style.backgroundColor = $('packaging-color').value;

    // Validation
    function setInvalid(input, msg) {
        input.classList.toggle('is-invalid', Boolean(msg));
        const fb = input.nextElementSibling;
        if (fb) fb.textContent = msg;
        return !msg;
    }
    const validators = {
        1() {
            const name = $('builder-name'), email = $('builder-email'), pw = $('builder-password'), cf = $('builder-confirm');
            return [
                setInvalid(name, name.value.trim().length < 2 ? 'Enter your name.' : ''),
                setInvalid(email, /^\S+@\S+\.\S+$/.test(email.value) ? '' : 'Enter a valid email.'),
                setInvalid(pw, pw.value.length < 8 ? 'At least 8 characters.' : ''),
                setInvalid(cf, cf.value && cf.value === pw.value ? '' : 'Passwords must match.')
            ].every(Boolean);
        },
        2: () => true,
        3: () => true
    };

    function showStep(n) {
        state.step = n;
        steps.forEach((s, i) => s.classList.toggle('is-active', i + 1 === n));
        $('step-progress').textContent = `Step ${n} of ${steps.length}`;
        $('step-progress').style.setProperty('--p', `${(n / steps.length) * 100}%`);
        $('step-back').disabled = n === 1;
        $('step-next').classList.toggle('d-none', n === steps.length);
        $('build-submit').classList.toggle('d-none', n !== steps.length);
    }
    function navigate(delta, callback) {
        if (delta > 0 && !validators[state.step]()) { playAfterClick('error'); return; }
        playSound('click');
        callback(state.step + delta);
    }
    $('step-next').addEventListener('click', () => navigate(1, showStep));
    $('step-back').addEventListener('click', () => navigate(-1, showStep));

    $('step-reset').addEventListener('click', () => {
        form.reset();
        form.querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));
        Object.assign(state, { base: 'rice', bowl: null });
        state.toppings.clear();
        tag.style.backgroundColor = $('packaging-color').value;
        greeting.textContent = defaultGreeting;
        $('formSuccess').classList.add('d-none');
        showStep(1);
        render();
    });

    function showResult(text, isError) {
        const box = $('formSuccess');
        box.textContent = text;
        box.classList.remove('d-none');
        box.classList.toggle('alert-success', !isError);
        box.classList.toggle('alert-danger', Boolean(isError));
        playAfterClick(isError ? 'error' : 'success');
        popAnimation(box);
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!validators[1]()) { showStep(1); playAfterClick('error'); return; }
        const payload = {
            name: $('builder-name').value.trim(),
            email: $('builder-email').value.trim(),
            meal: $('sum-name').textContent,
            kcal: Number($('sum-kcal').textContent),
            tagColor: $('packaging-color').value,
            notes: $('builder-notes').value
        };
        fetch('https://jsonplaceholder.typicode.com/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then((res) => res.json())
            .then((data) => showResult(`Thank you, ${payload.name}! Your meal #${data.id} (${payload.kcal} kcal) is saved.`))
            .catch(() => showResult('Network error. Please try again.', true));
    });

    showStep(1);
    render();
    }

    if (document.getElementById('orderForm')) {
    const $ = (id) => document.getElementById(id);
    const ZONES = {
        aitu: { label: 'Astana IT University Campus', from: 15, to: 20, min: 1500 },
        expo: { label: 'EXPO & Mega Silk Way Area',   from: 25, to: 35, min: 2500 },
        left: { label: 'Left Bank Center',            from: 30, to: 45, min: 3000 }
    };
    const DELIVERY = {
        express:  { label: 'AITU Express',      price: 700 },
        standard: { label: 'Standard Delivery', price: 500 },
        pickup:   { label: 'Self-Pickup',       price: 0 }
    };
    const MENU = [
        { id: 'chicken', name: 'Chicken Rice Bowl',   price: 1800 },
        { id: 'quinoa',  name: 'Quinoa Power Bowl',   price: 1700 },
        { id: 'wrap',    name: 'Turkey Veggie Wrap',  price: 1500 },
        { id: 'oats',    name: 'Protein Oatmeal',     price: 1200 },
        { id: 'shake',   name: 'Greek Yogurt Shake',  price: 900 }
    ];
    const state = { zone: 'aitu', delivery: null, cart: {} };
    const fmt = (n) => `${n.toLocaleString('ru-RU')} ₸`;

    $('order-greeting').textContent = getGreeting(new Date().getHours()) + '! Build your order.';

    const zoneSelect = $('zone-select');
    Object.entries(ZONES).forEach(([key, z]) => {
        zoneSelect.add(new Option(`${z.label} (${z.from}–${z.to} min)`, key));
    });
    const menuList = $('menu-list');
    MENU.forEach((item) => {
        const row = document.createElement('div');
        row.className = 'menu-row';
        row.innerHTML = `<span>${item.name} <small>${fmt(item.price)}</small></span>
            <button type="button" class="btn btn-outline-success btn-sm" data-add="${item.id}" aria-label="Add ${item.name}">+</button>`;
        menuList.appendChild(row);
    });

    function renderCart() {
        const lines = Object.entries(state.cart)
            .map(([id, qty]) => ({ ...MENU.find((m) => m.id === id), qty }))   // map
            .filter((l) => l.qty > 0);                                          // filter
        const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);        // reduce
        const delivery = state.delivery ? DELIVERY[state.delivery].price : 0;
        const list = $('cart-list');
        list.innerHTML = '';
        lines.forEach((l) => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${l.name} × ${l.qty}</span><button type="button" class="btn btn-sm btn-outline-danger" data-remove="${l.id}" aria-label="Remove ${l.name}">−</button>`;
            list.appendChild(li);
        });
        if (!lines.length) list.innerHTML = '<li class="text-secondary">Cart is empty. Add dishes from the menu.</li>';
        $('sum-sub').textContent = fmt(subtotal);
        $('sum-total').textContent = fmt(subtotal + delivery);
        const min = ZONES[state.zone].min;
        $('min-warning').textContent = subtotal && subtotal < min ? `Minimum order for this zone is ${fmt(min)}. Add ${fmt(min - subtotal)} more.` : '';
        $('zone-info').textContent = `Average time: ${ZONES[state.zone].from}–${ZONES[state.zone].to} min · minimum ${fmt(min)}`;
        return { lines, subtotal, min };
    }

    zoneSelect.addEventListener('change', (e) => { state.zone = e.target.value; playSound('click'); renderCart(); });
    menuList.addEventListener('click', (e) => {
        const id = e.target.dataset.add;
        if (!id) return;
        state.cart[id] = (state.cart[id] || 0) + 1;
        playSound('star');
        renderCart();
        popAnimation($('cart-list'));
    });
    $('cart-list').addEventListener('click', (e) => {
        const id = e.target.dataset.remove;
        if (!id) return;
        state.cart[id] = Math.max(0, state.cart[id] - 1);
        playSound('click');
        renderCart();
    });

    const deliveryButtons = document.querySelectorAll('[data-delivery]');
    function selectDelivery(type) {
        state.delivery = type;
        let text;
        switch (type) {
            case 'express': text = `${DELIVERY.express.label}: ${fmt(DELIVERY.express.price)}, courier to AITU`; break;
            case 'standard': text = `${DELIVERY.standard.label}: ${fmt(DELIVERY.standard.price)}, home delivery`; break;
            case 'pickup': text = `${DELIVERY.pickup.label}: free, collect at our kitchen`; break;
            default: text = 'not selected';
        }
        $('sum-delivery').textContent = text;
        deliveryButtons.forEach((btn) => {
            const active = btn.dataset.delivery === type;
            btn.closest('.fc-card').classList.toggle('is-selected', active);
            btn.classList.toggle('btn-success', active);
            btn.classList.toggle('btn-outline-success', !active);
            if (active) popAnimation(btn.closest('.fc-card'));
        });
        playAfterClick('success');
        renderCart();
    }
    deliveryButtons.forEach((btn) => btn.addEventListener('click', () => selectDelivery(btn.dataset.delivery)));

    $('eta-btn').addEventListener('click', () => {
        const now = new Date();
        const arrival = new Date(now.getTime() + ZONES[state.zone].to * 60000);
        $('eta-output').textContent = `Now ${now.toLocaleTimeString()} → arrival by about ${arrival.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        playSound('click');
    });

    function showResult(text, isError) {
        const box = $('orderSuccess');
        box.textContent = text;
        box.classList.remove('d-none');
        box.classList.toggle('alert-success', !isError);
        box.classList.toggle('alert-danger', Boolean(isError));
        playAfterClick(isError ? 'error' : 'success');
        popAnimation(box);
    }

    function runStatus() {
        const items = [...$('order-status').children];
        items.forEach((li) => li.classList.remove('is-done'));
        items.forEach((li, i) => setTimeout(() => { li.classList.add('is-done'); playSound('star'); }, (i + 1) * 1500));
    }

    const form = $('orderForm');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = $('order-customer'), address = $('order-address');
        const okName = name.value.trim().length >= 2, okAddr = address.value.trim().length >= 5;
        name.classList.toggle('is-invalid', !okName);
        address.classList.toggle('is-invalid', !okAddr);
        name.nextElementSibling.textContent = 'Enter your name.';
        address.nextElementSibling.textContent = 'Enter a full address.';
        const { lines, subtotal, min } = renderCart();
        if (!okName || !okAddr) return showResult('Please fix the highlighted fields.', true);
        if (!state.delivery) return showResult('Choose a delivery option first.', true);
        if (!lines.length) return showResult('Add at least one dish to your cart.', true);
        if (subtotal < min) return showResult(`Minimum order for this zone is ${fmt(min)}.`, true);
        fetch('https://jsonplaceholder.typicode.com/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customer: name.value.trim(), address: address.value.trim(), zone: state.zone, delivery: state.delivery, cart: state.cart, payment: $('payment-option').value })
        })
            .then((res) => res.json())
            .then((data) => { showResult(`Order #${data.id} accepted, ${name.value.trim()}!`); runStatus(); })
            .catch(() => showResult('Network error. Please try again.', true));
    });

    $('order-reset').addEventListener('click', () => {
        form.reset();
        form.querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));
        $('orderSuccess').classList.add('d-none');
        state.cart = {};
        selectDelivery(null);
        $('eta-output').textContent = '';
        [...$('order-status').children].forEach((li) => li.classList.remove('is-done'));
        playSound('click');
    });

    deliveryButtons[0].closest('.row').addEventListener('keydown', (e) => {
        const list = Array.from(deliveryButtons);
        const i = list.indexOf(document.activeElement);
        if (i === -1) return;
        switch (e.key) {
            case 'ArrowRight': case 'ArrowDown': e.preventDefault(); list[(i + 1) % list.length].focus(); break;
            case 'ArrowLeft': case 'ArrowUp': e.preventDefault(); list[(i - 1 + list.length) % list.length].focus(); break;
        }
    });
    renderCart();
    }

});