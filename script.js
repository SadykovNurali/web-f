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

    // Assignment 6: shows a jQuery toast. On pages without jQuery it simply does nothing.
    function notify(message, type) {
        if (window.foodCraftUI) window.foodCraftUI.toast(message, type);
    }

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

    // 1x1 transparent picture: placeholder until jQuery lazy loading swaps in the real photo
    const LAZY_PLACEHOLDER = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

    // Builds a card from one recipe object and appends it to the list
    function appendRecipeCard(recipe) {
        const column = document.createElement("div");
        column.className = "col-12 col-md-6 col-lg-4 recipe-item is-new";
        column.dataset.category = recipe.category;

        const ingredientsHtml = recipe.ingredients.map(function (ingredient) {
            return "<li>" + ingredient + "</li>";
        }).join("");

        // with jQuery: lazy loading (data-src); without jQuery: normal image
        const imageAttributes = window.jQuery
            ? 'src="' + LAZY_PLACEHOLDER + '" data-src="' + recipe.image + '" class="card-img-top recipe-card-img lazy-img"'
            : 'src="' + recipe.image + '" class="card-img-top recipe-card-img" loading="lazy"';

        column.innerHTML =
            '<article class="card fc-card h-100">' +
                '<img ' + imageAttributes + ' alt="' + recipe.alt + '">' +
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
                    notify(batch.length + " more recipes loaded", "success");
                })
                .catch(function () {
                    loadMoreButton.disabled = false;
                    notify("Could not load more recipes", "error");
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
                notify("Please correct the highlighted fields.", "error");
                return;
            }

            // Assignment 6 (jQuery): the button shows a spinner and "Please wait..." and stays
            // disabled for a short moment; then it returns to normal and the callback runs.
            // Without jQuery the old behaviour is used (just enable the button again).
            function finishSubmit(done) {
                if (window.foodCraftUI && submitButton) {
                    window.foodCraftUI.stopLoading(submitButton, done);
                } else {
                    if (submitButton) submitButton.disabled = false;
                    done();
                }
            }

            // Callback: runs when the server answered successfully
            function handleSuccess() {
                finishSubmit(function () {
                    setMessage("Success! Thank you for subscribing to Food Craft.", "success");
                    form.reset();
                    rules.forEach(function (rule) {
                        rule.input.classList.remove("is-valid", "is-invalid");
                    });
                    playSound("success");
                    notify("Subscribed successfully. Welcome to Food Craft!", "success");
                });
            }

            // Callback: runs when the request failed
            function handleError() {
                finishSubmit(function () {
                    setMessage("Could not send the form. Check your connection and try again.", "error");
                    playSound("error");
                    notify("Could not send the form. Please try again.", "error");
                });
            }

            setMessage("Sending...", "");
            if (submitButton) {
                if (window.foodCraftUI) window.foodCraftUI.startLoading(submitButton);
                else submitButton.disabled = true;
            }
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

/* =========================================================
   ASSIGNMENT 6. jQuery
   Everything below uses jQuery. Every feature first checks that
   its elements exist, so the same file works on all pages
   (a page without jQuery simply skips this whole block).
   ========================================================= */
(function ($) {
    "use strict";
    if (typeof $ === "undefined") return;

    /* =====================================================
       TASK 0. Setup
       ===================================================== */
    $(document).ready(function () {
        console.log("jQuery is ready!");

        /* ---------- data shared by the Team and Recipes pages ----------
           Key = role of the member (data-role on the team card). */
        const TEAM_PICKS = {
            content:     { name: "Asanali", recipe: "Avocado Toast" },
            research:    { name: "Nurali",  recipe: "Protein Pancakes" },
            development: { name: "Danial",  recipe: "Baked Salmon" }
        };

        function readFavorites() {                    // hearts from the Recipes page (localStorage)
            try { return JSON.parse(localStorage.getItem("fc-favorites")) || []; } catch (e) { return []; }
        }

        function recipeLink(title) {                  // link to a recipe card: recipes.html#recipe=Title
            return "recipes.html#recipe=" + encodeURIComponent(title);
        }

        /* ---------- small helpers ---------- */
        function escapeHtml(text) {
            return $("<div>").text(text).html();
        }

        function escapeRegExp(text) {
            return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        }

        // Returns safe HTML where every match of "term" is wrapped in open/close tags
        function markMatches(text, term, open, close) {
            const parts = text.split(new RegExp("(" + escapeRegExp(term) + ")", "gi"));
            // with a capture group, the odd items of the array are the matches
            return parts.map(function (part, i) {
                return i % 2 ? open + escapeHtml(part) + close : escapeHtml(part);
            }).join("");
        }

        /* =====================================================
           TASK 3. Search highlighting (used by tasks 1 and 3)
           Walks through the text nodes only, so the HTML tags
           (buttons, stars, links) are never broken.
           ===================================================== */
        function clearHighlights($scope) {
            $scope.find("mark.search-hit").each(function () {
                $(this).replaceWith(document.createTextNode($(this).text()));
            });
            $scope.each(function () { this.normalize(); });   // glue split text nodes back together
        }

        function highlight($scope, term) {
            clearHighlights($scope);
            if (!term) return 0;

            $scope.find("*").addBack().contents().filter(function () {
                return this.nodeType === 3 && this.nodeValue.trim() !== "";
            }).each(function () {
                const html = markMatches(this.nodeValue, term, '<mark class="search-hit">', "</mark>");
                if (html.indexOf("<mark") !== -1) $(this).replaceWith(html);
            });
            return $scope.find("mark.search-hit").length;
        }

        /* =====================================================
           TASK 9. Image lazy loading
           Images keep a tiny placeholder in src and the real
           address in data-src. When the image gets close to the
           visible part of the page, data-src is moved to src.
           ===================================================== */
        function loadVisibleImages() {
            const winTop = $(window).scrollTop();
            const winBottom = winTop + $(window).height();
            const margin = 250;                       // start loading a little before it appears

            $("img.lazy-img[data-src]").each(function () {
                const $img = $(this);
                if (!$img.is(":visible")) return;     // hidden by a filter or search: wait

                const top = $img.offset().top;
                const bottom = top + $img.outerHeight();
                if (bottom >= winTop - margin && top <= winBottom + margin) {
                    $img.one("load", function () { $img.addClass("is-loaded"); })
                        .one("error", function () { this.src = "images/foodcraft.jpg"; })
                        .attr("src", $img.attr("data-src"))
                        .removeAttr("data-src");
                }
            });
        }

        let lazyQueued = false;
        function requestLazyCheck() {                 // at most one check per animation frame
            if (lazyQueued) return;
            lazyQueued = true;
            window.requestAnimationFrame(function () {
                lazyQueued = false;
                loadVisibleImages();
            });
        }

        /* =====================================================
           TASK 7. Notification system (toast)
           Appears, stays for a moment, then fades out.
           ===================================================== */
        const TOAST_ICONS = { success: "✓", error: "!", info: "i" };

        function showToast(message, type) {
            type = TOAST_ICONS[type] ? type : "success";

            let $wrap = $("#toast-wrap");
            if (!$wrap.length) {
                $wrap = $('<div id="toast-wrap" class="fc-toast-wrap" role="status" aria-live="polite"></div>').appendTo("body");
            }
            while ($wrap.children().length >= 4) $wrap.children().first().remove();   // keep the screen clean

            $('<div class="fc-toast"></div>')
                .addClass("fc-toast-" + type)
                .append($('<span class="fc-toast-icon" aria-hidden="true"></span>').text(TOAST_ICONS[type]))
                .append($('<span class="fc-toast-text"></span>').text(message))
                .hide()
                .appendTo($wrap)
                .fadeIn(250)
                .delay(2800)
                .fadeOut(500, function () { $(this).remove(); })
                .on("click", function () {            // a click closes the toast earlier
                    $(this).stop(true).fadeOut(200, function () { $(this).remove(); });
                });
        }

        /* =====================================================
           TASK 6. Loading spinner on submit
           startLoading: spinner + "Please wait..." + disabled
           stopLoading:  after a short delay -> normal button
           ===================================================== */
        const MIN_LOADING_MS = 1500;                  // the "server call" is shown at least this long

        function startLoading(button) {
            const $btn = $(button);
            if ($btn.data("loading")) return;
            $btn.data("label", $btn.html())
                .data("loading", true)
                .data("loadingStart", Date.now())
                .prop("disabled", true)               // no repeated clicks
                .attr("aria-busy", "true")
                .addClass("is-loading")
                .html('<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Please wait…');
        }

        function stopLoading(button, done) {
            const $btn = $(button);
            const elapsed = Date.now() - ($btn.data("loadingStart") || 0);
            window.setTimeout(function () {
                if ($btn.data("loading")) {
                    $btn.html($btn.data("label"))
                        .data("loading", false)
                        .prop("disabled", false)
                        .attr("aria-busy", "false")
                        .removeClass("is-loading");
                }
                if (typeof done === "function") done();
            }, Math.max(0, MIN_LOADING_MS - elapsed));
        }

        // The vanilla code above (form validation) calls these helpers
        window.foodCraftUI = { toast: showToast, startLoading: startLoading, stopLoading: stopLoading };

        /* =====================================================
           TASK 4. Colorful and stylized scroll progress bar
           ===================================================== */
        const $progressBar = $('<span class="scroll-progress-bar is-empty"></span>');
        $('<div class="scroll-progress" aria-hidden="true"></div>').append($progressBar).prependTo("body");

        function updateProgress() {
            const scrollable = $(document).height() - $(window).height();
            const percent = scrollable > 0 ? Math.min(100, ($(window).scrollTop() / scrollable) * 100) : 0;
            $progressBar.css("width", percent + "%")
                .toggleClass("is-empty", percent < 0.5)
                .toggleClass("is-complete", percent > 99.5);
        }

        /* =====================================================
           TASK 5. Animated number counter
           Starts once, when the number scrolls into view.
           ===================================================== */
        function runCounters() {
            const winTop = $(window).scrollTop();
            const winBottom = winTop + $(window).height();

            $(".counter").each(function () {
                const $counter = $(this);
                if ($counter.data("done")) return;

                const top = $counter.offset().top;
                if (top + $counter.outerHeight() < winTop || top > winBottom - 40) return;   // not visible yet

                $counter.data("done", true);
                const target = parseInt($counter.attr("data-target"), 10) || 0;
                const suffix = $counter.attr("data-suffix") || "";

                $({ value: 0 }).animate({ value: target }, {
                    duration: 2000,
                    easing: "swing",
                    step: function (now) { $counter.text(Math.floor(now).toLocaleString("en-US") + suffix); },
                    complete: function () { $counter.text(target.toLocaleString("en-US") + suffix); }
                });
            });
        }

        /* =====================================================
           EXTRA 3. "Back to top" button (appears after scrolling down)
           ===================================================== */
        const $backToTop = $('<button type="button" class="back-to-top" aria-label="Back to top">↑</button>')
            .hide().appendTo("body");
        let backVisible = false;

        function updateBackToTop() {
            const shouldShow = $(window).scrollTop() > 400;
            if (shouldShow === backVisible) return;
            backVisible = shouldShow;
            if (shouldShow) $backToTop.stop(true, true).fadeIn(250);
            else $backToTop.stop(true, true).fadeOut(250);
        }
        $backToTop.on("click", function () {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });

        $(window).on("scroll resize", function () {
            updateBackToTop();
            updateProgress();
            runCounters();
            requestLazyCheck();
        });
        $(window).on("load", function () {
            updateProgress();
            runCounters();
            requestLazyCheck();
        });
        updateProgress();
        runCounters();

        /* =====================================================
           RECIPES PAGE (tasks 1, 2, 3, 8, 9)
           ===================================================== */
        const $recipeList = $("#recipe-list");

        if ($recipeList.length) {
            const RECIPE_TEXT = ".card-title, .card-text, .recipe-tag, .card-body ul li";
            const $searchInput = $("#recipe-search");
            const $noRecipes = $("#no-recipes");
            const defaultNoRecipesText = $noRecipes.text();

            /* ---------- TASK 1. Real-time search and live filter ----------
               Works together with the category buttons: a recipe is shown
               only if it passes BOTH the category filter and the search. */
            function applyRecipeSearch() {
                const term = $searchInput.val().trim();
                const lowerTerm = term.toLowerCase();
                const $items = $recipeList.find(".recipe-item");

                const $matches = $items.filter(function () {
                    return !lowerTerm || $(this).find(RECIPE_TEXT).text().toLowerCase().indexOf(lowerTerm) !== -1;
                });
                $items.not($matches).addClass("is-search-hidden");
                $matches.removeClass("is-search-hidden");

                // EXTRA: "Favorites" filter (third condition, together with category and search)
                const favOnly = $("#fav-filter-btn").attr("aria-pressed") === "true";
                $items.each(function () {
                    const title = $(this).find(".card-title").text().trim();
                    $(this).toggleClass("is-fav-hidden", favOnly && favorites.indexOf(title) === -1);
                });

                highlight($items.find(RECIPE_TEXT), term);          // task 3 on the recipe cards

                const visible = $items.not(".is-hidden").not(".is-search-hidden").not(".is-fav-hidden").length;
                $("#recipe-count").text("Showing " + visible + " of " + $items.length + " recipes");
                $noRecipes
                    .text(term ? "No recipes match “" + term + "”."
                        : favOnly ? "No favorites here yet. Tap the ♥ on a recipe."
                        : defaultNoRecipesText)
                    .toggleClass("d-none", visible > 0);

                requestLazyCheck();                                  // newly shown images may need loading
            }

            /* ---------- TASK 2. Autocomplete suggestions ---------- */
            const $suggest = $("#search-suggestions");
            let suggestIndex = -1;

            // "2 eggs" -> "Eggs", "50 g oats" -> "Oats"
            function cleanIngredient(text) {
                const cleaned = text.replace(/^[\d.,/]+\s*(g|kg|ml|l|teaspoons?|tablespoons?|cups?)?\s+/i, "").trim();
                return cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : text;
            }

            // Suggestions come from the cards that are on the page right now (also the loaded ones)
            function collectSuggestions() {
                const seen = {};
                const list = [];
                function add(text, type) {
                    const key = text.toLowerCase();
                    if (!text || seen[key]) return;
                    seen[key] = true;
                    list.push({ text: text, type: type });
                }
                $recipeList.find(".recipe-item").each(function () {
                    add($(this).find(".card-title").text().trim(), "Recipe");
                    $(this).find(".card-body ul li").each(function () {
                        add(cleanIngredient($(this).text().trim()), "Ingredient");
                    });
                });
                return list;
            }

            function hideSuggestions() {
                $suggest.prop("hidden", true).empty();
                $searchInput.attr("aria-expanded", "false").removeAttr("aria-activedescendant");
                suggestIndex = -1;
            }

            function showSuggestions() {
                const term = $searchInput.val().trim();
                if (!term) { hideSuggestions(); return; }

                const lowerTerm = term.toLowerCase();
                const matches = collectSuggestions()
                    .filter(function (s) {
                        const lower = s.text.toLowerCase();
                        return lower.indexOf(lowerTerm) !== -1 && lower !== lowerTerm;
                    })
                    .sort(function (a, b) {               // suggestions that START with the text go first
                        const aStarts = a.text.toLowerCase().indexOf(lowerTerm) === 0 ? 0 : 1;
                        const bStarts = b.text.toLowerCase().indexOf(lowerTerm) === 0 ? 0 : 1;
                        return aStarts - bStarts;
                    })
                    .slice(0, 6);

                if (!matches.length) { hideSuggestions(); return; }

                $suggest.empty();
                $.each(matches, function (i, suggestion) {
                    $("<li>", { role: "option", id: "suggestion-" + i, "aria-selected": "false", "data-value": suggestion.text })
                        .html(markMatches(suggestion.text, term, "<strong>", "</strong>"))
                        .append($("<span>", { "class": "suggestion-type", text: suggestion.type }))
                        .appendTo($suggest);
                });
                suggestIndex = -1;
                $suggest.prop("hidden", false);
                $searchInput.attr("aria-expanded", "true");
            }

            function setActiveSuggestion(index) {
                const $options = $suggest.children();
                if (!$options.length) return;
                suggestIndex = (index + $options.length) % $options.length;
                $options.removeClass("is-active").attr("aria-selected", "false");
                const $active = $options.eq(suggestIndex).addClass("is-active").attr("aria-selected", "true");
                $searchInput.attr("aria-activedescendant", $active.attr("id"));
            }

            function pickSuggestion(value) {
                $searchInput.val(value);
                hideSuggestions();
                applyRecipeSearch();
                $searchInput.trigger("focus");
            }

            $searchInput.on("input", function () {
                applyRecipeSearch();                      // live filter on every typed character
                showSuggestions();
            });
            $searchInput.on("click", showSuggestions);

            $searchInput.on("keydown", function (event) {
                const isOpen = !$suggest.prop("hidden");
                switch (event.key) {
                    case "ArrowDown":
                        if (isOpen) { event.preventDefault(); setActiveSuggestion(suggestIndex + 1); }
                        break;
                    case "ArrowUp":
                        if (isOpen) {
                            event.preventDefault();
                            setActiveSuggestion(suggestIndex === -1 ? $suggest.children().length - 1 : suggestIndex - 1);
                        }
                        break;
                    case "Enter":
                        if (isOpen && suggestIndex > -1) {
                            event.preventDefault();
                            pickSuggestion($suggest.children().eq(suggestIndex).attr("data-value"));
                        }
                        break;
                    case "Escape":
                        hideSuggestions();
                        break;
                }
            });

            // mousedown (not click) so the input does not lose focus before the choice is made
            $suggest.on("mousedown", "li", function (event) {
                event.preventDefault();
                pickSuggestion($(this).attr("data-value"));
            });

            $(document).on("click", function (event) {
                if (!$(event.target).closest(".recipe-search").length) hideSuggestions();
            });

            // The category buttons have their own handler (added earlier);
            // this delegated one runs after it, so search + category work together.
            $(document).on("click", "[data-filter]", applyRecipeSearch);

            /* ---------- TASK 8. "Copy ingredients" button ---------- */
            const ICON_COPY = '<svg class="copy-icon" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"></rect><path d="M5 15V6a2 2 0 0 1 2-2h9"></path></svg>';
            const ICON_CHECK = '<svg class="copy-icon" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 13l4 4L19 7"></path></svg>';
            let copyingByCode = false;

            function addCopyButtons() {
                $recipeList.find(".recipe-item").each(function () {
                    const $item = $(this);
                    const $heading = $item.find(".ingredients-title");
                    if (!$heading.length || $item.find(".copy-btn").length) return;

                    const title = $item.find(".card-title").text().trim();
                    const $button = $('<button type="button" class="btn btn-outline-success btn-sm copy-btn"></button>')
                        .attr("aria-label", "Copy ingredients of " + title)
                        .html(ICON_COPY + '<span class="copy-label">Copy</span>')
                        .append('<span class="copy-tooltip" aria-hidden="true">Copied to clipboard!</span>');

                    // heading + button side by side (the heading keeps its own style)
                    $heading.wrap('<div class="ingredients-head"></div>').after($button);
                });
            }

            // Modern API first; old execCommand as a fallback (for pages opened without https)
            function copyText(text) {
                if (navigator.clipboard && window.isSecureContext) {
                    return navigator.clipboard.writeText(text);
                }
                return new Promise(function (resolve, reject) {
                    const $temp = $("<textarea readonly>").val(text)
                        .css({ position: "fixed", top: 0, left: 0, opacity: 0 }).appendTo("body");
                    $temp[0].select();
                    copyingByCode = true;
                    let ok = false;
                    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
                    copyingByCode = false;
                    $temp.remove();
                    if (ok) resolve(); else reject(new Error("copy failed"));
                });
            }

            function showCopied($button, title) {
                window.clearTimeout($button.data("timer"));
                $button.addClass("is-copied")
                    .find(".copy-icon").replaceWith(ICON_CHECK);
                $button.find(".copy-label").text("Copied");
                $button.find(".copy-tooltip").stop(true, true).fadeIn(150);

                showToast("Ingredients of “" + title + "” copied", "success");

                $button.data("timer", window.setTimeout(function () {
                    $button.removeClass("is-copied")
                        .find(".copy-icon").replaceWith(ICON_COPY);
                    $button.find(".copy-label").text("Copy");
                    $button.find(".copy-tooltip").fadeOut(250);
                }, 2000));
            }

            $recipeList.on("click", ".copy-btn", function () {
                const $button = $(this);
                const $item = $button.closest(".recipe-item");
                const title = $item.find(".card-title").text().trim();
                const lines = $item.find(".card-body ul li").map(function () {
                    return "• " + $(this).text().trim();
                }).get();

                copyText(title + " – ingredients:\n" + lines.join("\n")).then(function () {
                    showCopied($button, title);
                }, function () {
                    showToast("Could not copy. Please select the text and press Ctrl+C.", "error");
                });
            });

            // The browser "copy" event: also confirm when the person copies a selection by hand (Ctrl+C)
            $(document).on("copy", function () {
                if (copyingByCode) return;
                if (String(window.getSelection()).length > 0) showToast("Text copied to clipboard", "info");
            });

            /* =====================================================
               EXTRA 1. Favorites (heart on every card, saved in localStorage)
               ===================================================== */
            let favorites = [];
            try { favorites = JSON.parse(localStorage.getItem("fc-favorites")) || []; } catch (e) { favorites = []; }

            function saveFavorites() {
                try { localStorage.setItem("fc-favorites", JSON.stringify(favorites)); } catch (e) { /* ignore */ }
                $("#fav-count").text(favorites.length);
            }

            function addFavButtons() {
                $recipeList.find(".recipe-item").each(function () {
                    const $item = $(this);
                    if ($item.find(".fav-btn").length) return;
                    const title = $item.find(".card-title").text().trim();
                    const isFav = favorites.indexOf(title) !== -1;
                    $('<button type="button" class="fav-btn"></button>')
                        .toggleClass("is-fav", isFav)
                        .attr({ "aria-pressed": String(isFav), "aria-label": "Favorite: " + title })
                        .text("♥")
                        .prependTo($item.find("article.card"));
                });
            }

            $recipeList.on("click", ".fav-btn", function () {
                const $button = $(this);
                const title = $button.closest(".recipe-item").find(".card-title").text().trim();
                const index = favorites.indexOf(title);
                const nowFav = index === -1;

                if (nowFav) favorites.push(title); else favorites.splice(index, 1);
                saveFavorites();

                $button.toggleClass("is-fav", nowFav).attr("aria-pressed", String(nowFav)).removeClass("pop-anim");
                void $button[0].offsetWidth;                       // restart the pop animation
                $button.addClass("pop-anim");

                showToast(nowFav ? "“" + title + "” added to favorites" : "“" + title + "” removed from favorites",
                          nowFav ? "success" : "info");
                if ($("#fav-filter-btn").attr("aria-pressed") === "true") applyRecipeSearch();
            });

            $("#fav-filter-btn").on("click", function () {
                const $button = $(this);
                const on = $button.attr("aria-pressed") !== "true";
                $button.attr("aria-pressed", String(on)).toggleClass("active", on);
                applyRecipeSearch();
            });
            $("#fav-count").text(favorites.length);

            /* =====================================================
               EXTRA 2. "Surprise me": picks a random visible recipe
               ===================================================== */
            $("#surprise-btn").on("click", function () {
                const $pool = $recipeList.find(".recipe-item").not(".is-hidden, .is-search-hidden, .is-fav-hidden");
                if (!$pool.length) {
                    showToast("Nothing to pick from. Clear the search or filters first.", "info");
                    return;
                }
                const $pick = $pool.eq(Math.floor(Math.random() * $pool.length));
                const title = $pick.find(".card-title").text().trim();

                $recipeList.find(".surprise-glow").removeClass("surprise-glow");
                $pick[0].scrollIntoView({ behavior: "smooth", block: "center" });
                $pick.find(".fc-card").addClass("surprise-glow");
                showToast("Try today: " + title, "info");
                window.setTimeout(function () { $pick.find(".fc-card").removeClass("surprise-glow"); }, 2600);
            });

            /* =====================================================
               CONNECTION WITH THE TEAM PAGE
               1) "Team pick" badge on the recipes chosen by team members
               2) a link like recipes.html#recipe=Baked%20Salmon scrolls to that card
               ===================================================== */
            function addTeamBadges() {
                $.each(TEAM_PICKS, function (role, pick) {
                    $recipeList.find(".recipe-item").filter(function () {
                        return $(this).find(".card-title").text().trim() === pick.recipe;
                    }).each(function () {
                        const $item = $(this);
                        const $tag = $item.find(".recipe-tag");
                        if (!$tag.length || $item.find(".team-pick-badge").length) return;

                        const $badge = $('<a class="team-pick-badge" href="team.html"></a>')
                            .text("★ Team pick: " + pick.name)
                            .attr("title", "Meet " + pick.name + " on the Our Team page");
                        $tag.wrap('<div class="recipe-tags"></div>').after($badge);
                    });
                });
            }

            function openRecipeFromLink() {
                const match = window.location.hash.match(/^#recipe=(.+)$/);
                if (!match) return;
                let title;
                try { title = decodeURIComponent(match[1]); } catch (e) { return; }

                const $item = $recipeList.find(".recipe-item").filter(function () {
                    return $(this).find(".card-title").text().trim().toLowerCase() === title.toLowerCase();
                }).first();

                if (!$item.length) {
                    showToast("Recipe “" + title + "” was not found.", "error");
                    return;
                }

                // make sure the card is not hidden by a filter, then show it
                $(".recipe-filters [data-filter=all]").not(".active").trigger("click");
                $searchInput.val("");
                applyRecipeSearch();

                $recipeList.find(".surprise-glow").removeClass("surprise-glow");
                $item[0].scrollIntoView({ behavior: "smooth", block: "center" });
                $item.find(".fc-card").addClass("surprise-glow");
                window.setTimeout(function () { $item.find(".fc-card").removeClass("surprise-glow"); }, 2600);
                showToast("Opened: " + title, "info");

                // safety check: if the page height changed while scrolling, bring the card back
                window.setTimeout(function () {
                    const rect = $item[0].getBoundingClientRect();
                    if (rect.bottom < 0 || rect.top > window.innerHeight) {
                        $item[0].scrollIntoView({ behavior: "smooth", block: "center" });
                    }
                }, 1300);
            }

            /* ---------- Cards added later by "Load more recipes" ----------
               Watch the list: new card -> copy button, heart, search, lazy loading. */
            addCopyButtons();
            addFavButtons();
            addTeamBadges();
            window.setTimeout(openRecipeFromLink, 400);        // after the cards are fully built
            $(window).on("hashchange", openRecipeFromLink);
            new MutationObserver(function () {
                addCopyButtons();
                addFavButtons();
                addTeamBadges();
                applyRecipeSearch();
            }).observe($recipeList[0], { childList: true });

            requestLazyCheck();
        }

        /* =====================================================
           CONNECTION WITH THE RECIPES PAGE (team side)
           1) every member gets a link to his favorite recipe
           2) "Your Favorite Recipes": hearts saved on the Recipes page
           ===================================================== */
        $(".team-member").each(function () {
            const pick = TEAM_PICKS[$(this).attr("data-role")];
            if (!pick) return;
            $('<p class="team-pick mt-3 mb-0">Favorite recipe: </p>')
                .append($("<a>", { href: recipeLink(pick.recipe), text: pick.recipe }))
                .appendTo($(this).find(".card-body"));
        });

        const $teamFavorites = $("#team-favorites");

        function renderTeamFavorites() {
            const favorites = readFavorites();
            $teamFavorites.empty();
            $.each(favorites, function (i, title) {
                $("<a>", { "class": "btn btn-outline-success btn-sm", href: recipeLink(title), text: "♥ " + title })
                    .appendTo($teamFavorites);
            });
            $("#team-favorites-empty").toggleClass("d-none", favorites.length > 0);
        }

        if ($teamFavorites.length) {
            renderTeamFavorites();
            // another tab changed the hearts -> update the list
            $(window).on("storage", function (event) {
                if (event.originalEvent.key === "fc-favorites") renderTeamFavorites();
            });
        }

        /* =====================================================
           TEAM PAGE EXTRA: filter members by role (fade animation)
           ===================================================== */
        const $teamMembers = $(".team-member");

        if ($teamMembers.length) {
            $(".team-filters").on("click", "[data-role-filter]", function () {
                const $button = $(this);
                const role = $button.attr("data-role-filter");

                $button.siblings().removeClass("active").attr("aria-pressed", "false");
                $button.addClass("active").attr("aria-pressed", "true");

                const $show = $teamMembers.filter(function () {
                    return role === "all" || $(this).attr("data-role") === role;
                });

                $teamMembers.stop(true, true);
                // first the other cards fade out, then the chosen ones fade in
                $teamMembers.not($show).fadeOut(200).promise().then(function () {
                    $show.fadeIn(300);
                });
                $("#team-count").text("Showing " + $show.length + " of " + $teamMembers.length + " team members");
            });
        }

        /* =====================================================
           TASK 3. FAQ search with highlighting
           Highlights every match, opens the answers that contain it.
           ===================================================== */
        const $faqSearch = $("#faq-search");

        if ($faqSearch.length) {
            const FAQ_TEXT = ".accordion-header span:first-child, .accordion-content p";
            const $faqStatus = $("#faq-search-status");

            function setFaqOpen($item, open) {
                $item.toggleClass("is-open", open);
                $item.find(".accordion-header").attr("aria-expanded", String(open));
            }

            $faqSearch.on("input", function () {
                const term = $faqSearch.val().trim();
                const $items = $(".faq-item");
                const total = highlight($items.find(FAQ_TEXT), term);

                let questionsWithMatch = 0;
                $items.each(function () {
                    const $item = $(this);
                    const hasMatch = $item.find("mark.search-hit").length > 0;

                    if (term && hasMatch) {
                        questionsWithMatch++;
                        if (!$item.hasClass("is-open")) {
                            $item.data("autoOpened", true);       // remember: opened by the search
                            setFaqOpen($item, true);
                        }
                    } else if ($item.data("autoOpened")) {        // close only what the search opened
                        $item.data("autoOpened", false);
                        setFaqOpen($item, false);
                    }
                });

                if (!term) {
                    $faqStatus.text("");
                } else if (total === 0) {
                    $faqStatus.text("No matches found.");
                } else {
                    $faqStatus.text(total + (total === 1 ? " match" : " matches") + " in " +
                        questionsWithMatch + (questionsWithMatch === 1 ? " question" : " questions"));
                }
            });
        }
    });
})(window.jQuery);

/* =========================================================
   ASSIGNMENT 6. jQuery for the MEAL BUILDER and ORDER pages
   Uses the helpers made above (window.foodCraftUI: toast,
   startLoading, stopLoading). Runs only on builder.html and
   order.html; every other page skips this block.
   Tasks: 1 live filter, 2 autocomplete, 3 highlighting,
   6 spinner on submit, 7 toasts, 8 copy button
   (4 progress bar, 5 counters and 9 lazy loading are global
   and work on these pages as soon as jQuery is loaded).
   ========================================================= */
(function ($) {
    "use strict";
    if (typeof $ === "undefined") return;

    $(document).ready(function () {
        const $buildForm = $("#buildForm");
        const $orderForm = $("#orderForm");
        if (!$buildForm.length && !$orderForm.length) return;

        const ui = window.foodCraftUI || {
            toast: function () {},
            startLoading: function () {},
            stopLoading: function (button, done) { if (done) done(); }
        };

        /* ---------- small helpers (search + highlight) ---------- */
        function escapeHtml(text) {
            return $("<div>").text(text).html();
        }

        function escapeRegExp(text) {
            return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        }

        function markMatches(text, term, open, close) {
            const parts = text.split(new RegExp("(" + escapeRegExp(term) + ")", "gi"));
            return parts.map(function (part, i) {
                return i % 2 ? open + escapeHtml(part) + close : escapeHtml(part);
            }).join("");
        }

        function clearHighlights($scope) {
            $scope.find("mark.search-hit").each(function () {
                $(this).replaceWith(document.createTextNode($(this).text()));
            });
            $scope.each(function () { this.normalize(); });
        }

        // TASK 3: wraps every match in <mark>; only text nodes are touched, so buttons stay safe
        function highlight($scope, term) {
            clearHighlights($scope);
            if (!term) return 0;
            $scope.find("*").addBack().contents().filter(function () {
                return this.nodeType === 3 && this.nodeValue.trim() !== "";
            }).each(function () {
                const html = markMatches(this.nodeValue, term, '<mark class="search-hit">', "</mark>");
                if (html.indexOf("<mark") !== -1) $(this).replaceWith(html);
            });
            return $scope.find("mark.search-hit").length;
        }

        /* =====================================================
           TASKS 1 + 2 + 3. One reusable search:
           live filter, autocomplete dropdown, highlighting.
           options: input, suggest, count, none, items, text,
                    noun, suggestions()
           ===================================================== */
        function setupSearch(o) {
            const $input = $(o.input);
            const $suggest = $(o.suggest);
            const $count = $(o.count);
            const $none = $(o.none);
            let activeIndex = -1;

            // TASK 1. Live filter: runs on every typed character
            function applySearch() {
                const term = $input.val().trim();
                const lower = term.toLowerCase();
                const $all = $(o.items);

                const $matches = $all.filter(function () {
                    return !lower || $(this).find(o.text).text().toLowerCase().indexOf(lower) !== -1;
                });
                $all.not($matches).addClass("is-search-hidden");
                $matches.removeClass("is-search-hidden");

                highlight($all.find(o.text), term);             // TASK 3

                $count.text(term ? "Showing " + $matches.length + " of " + $all.length + " " + o.noun : "");
                $none.text(term ? "Nothing matches “" + term + "”." : "")
                     .toggleClass("d-none", !term || $matches.length > 0);

                $(window).trigger("scroll");                    // newly shown images may need lazy loading
            }

            // TASK 2. Autocomplete suggestions
            function hideSuggestions() {
                $suggest.prop("hidden", true).empty();
                $input.attr("aria-expanded", "false").removeAttr("aria-activedescendant");
                activeIndex = -1;
            }

            function showSuggestions() {
                const term = $input.val().trim();
                if (!term) { hideSuggestions(); return; }
                const lower = term.toLowerCase();

                const seen = {};
                const matches = o.suggestions().filter(function (s) {
                    const key = s.text.toLowerCase();
                    if (!s.text || seen[key]) return false;
                    seen[key] = true;
                    return key.indexOf(lower) !== -1 && key !== lower;
                }).sort(function (a, b) {                       // suggestions that START with the text go first
                    const aStarts = a.text.toLowerCase().indexOf(lower) === 0 ? 0 : 1;
                    const bStarts = b.text.toLowerCase().indexOf(lower) === 0 ? 0 : 1;
                    return aStarts - bStarts;
                }).slice(0, 6);

                if (!matches.length) { hideSuggestions(); return; }

                $suggest.empty();
                $.each(matches, function (i, s) {
                    $("<li>", { role: "option", id: o.suggest.slice(1) + "-" + i, "aria-selected": "false", "data-value": s.text })
                        .html(markMatches(s.text, term, "<strong>", "</strong>"))
                        .append($("<span>", { "class": "suggestion-type", text: s.type }))
                        .appendTo($suggest);
                });
                activeIndex = -1;
                $suggest.prop("hidden", false);
                $input.attr("aria-expanded", "true");
            }

            function setActive(index) {
                const $options = $suggest.children();
                if (!$options.length) return;
                activeIndex = (index + $options.length) % $options.length;
                $options.removeClass("is-active").attr("aria-selected", "false");
                const $active = $options.eq(activeIndex).addClass("is-active").attr("aria-selected", "true");
                $input.attr("aria-activedescendant", $active.attr("id"));
            }

            function pick(value) {
                $input.val(value);
                hideSuggestions();
                applySearch();
                $input.trigger("focus");
            }

            $input.on("input", function () { applySearch(); showSuggestions(); });
            $input.on("click", showSuggestions);

            $input.on("keydown", function (event) {
                const isOpen = !$suggest.prop("hidden");
                switch (event.key) {
                    case "ArrowDown":
                        if (isOpen) { event.preventDefault(); setActive(activeIndex + 1); }
                        break;
                    case "ArrowUp":
                        if (isOpen) {
                            event.preventDefault();
                            setActive(activeIndex === -1 ? $suggest.children().length - 1 : activeIndex - 1);
                        }
                        break;
                    case "Enter":
                        if (isOpen && activeIndex > -1) {
                            event.preventDefault();
                            pick($suggest.children().eq(activeIndex).attr("data-value"));
                        }
                        break;
                    case "Escape":
                        hideSuggestions();
                        break;
                }
            });

            // mousedown (not click): the input must not lose focus before the choice is made
            $suggest.on("mousedown", "li", function (event) {
                event.preventDefault();
                pick($(this).attr("data-value"));
            });

            $(document).on("click", function (event) {
                if (!$(event.target).closest($input.closest(".recipe-search")).length) hideSuggestions();
            });
        }

        /* =====================================================
           TASK 8. Copy to clipboard (button + checkmark + tooltip)
           ===================================================== */
        const ICON_COPY = '<svg class="copy-icon" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"></rect><path d="M5 15V6a2 2 0 0 1 2-2h9"></path></svg>';
        const ICON_CHECK = '<svg class="copy-icon" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 13l4 4L19 7"></path></svg>';
        let copyingByCode = false;

        // Modern API first; old execCommand as a fallback (pages opened without https)
        function copyText(text) {
            if (navigator.clipboard && window.isSecureContext) {
                return navigator.clipboard.writeText(text);
            }
            return new Promise(function (resolve, reject) {
                const $temp = $("<textarea readonly>").val(text)
                    .css({ position: "fixed", top: 0, left: 0, opacity: 0 }).appendTo("body");
                $temp[0].select();
                copyingByCode = true;
                let ok = false;
                try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
                copyingByCode = false;
                $temp.remove();
                if (ok) resolve(); else reject(new Error("copy failed"));
            });
        }

        function showCopied($button) {
            window.clearTimeout($button.data("timer"));
            $button.addClass("is-copied").find(".copy-icon").replaceWith(ICON_CHECK);
            $button.find(".copy-label").text("Copied");
            $button.find(".copy-tooltip").stop(true, true).fadeIn(150);

            $button.data("timer", window.setTimeout(function () {
                $button.removeClass("is-copied").find(".copy-icon").replaceWith(ICON_COPY);
                $button.find(".copy-label").text($button.attr("data-label") || "Copy");
                $button.find(".copy-tooltip").fadeOut(250);
            }, 2000));
        }

        function copyWithButton($button, text, message) {
            if (!$button.attr("data-label")) $button.attr("data-label", $button.find(".copy-label").text());
            copyText(text).then(function () {
                showCopied($button);
                ui.toast(message, "success");
            }, function () {
                ui.toast("Could not copy. Please select the text and press Ctrl+C.", "error");
            });
        }

        // The browser "copy" event: also confirm a copy made by hand (Ctrl+C)
        $(document).on("copy", function () {
            if (copyingByCode) return;
            if (String(window.getSelection()).length > 0) ui.toast("Text copied to clipboard", "info");
        });

        
        function setupSubmit(formId, boxId, buttonSelector) {
            const box = document.getElementById(boxId);
            const $btn = $(buttonSelector);
            let ticks = 0;          // how many times the result box was changed
            let before = 0;
            let waiting = false;
            let timer = null;

            function finish() {
                waiting = false;
                window.clearTimeout(timer);
                const isError = box.classList.contains("alert-danger");
                const message = $(box).text().trim();
                ui.stopLoading($btn, function () { ui.toast(message, isError ? "error" : "success"); });
            }

            new MutationObserver(function () {
                if (box.classList.contains("d-none")) return;      // the box was only hidden (reset)
                ticks++;
                if (waiting) finish();
            }).observe(box, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ["class"] });

            // capture phase: runs before the vanilla submit handler
            document.addEventListener("submit", function (event) {
                if (event.target.id === formId) before = ticks;
            }, true);

            // bubbling phase: runs after the vanilla submit handler
            $(document).on("submit", "#" + formId, function () {
                if (ticks !== before) {                            // vanilla code already showed an error
                    ui.toast($(box).text().trim(), box.classList.contains("alert-danger") ? "error" : "success");
                    return;
                }
                if ($("#" + formId).find(".is-invalid").length) {  // invalid fields: no server call
                    ui.toast("Please fix the highlighted fields.", "error");
                    return;
                }
                waiting = true;
                ui.startLoading($btn);
                timer = window.setTimeout(function () {            // safety: never stay disabled forever
                    if (waiting) { waiting = false; ui.stopLoading($btn); }
                }, 15000);
            });
        }

        if ($buildForm.length) {
            setupSearch({
                input: "#builder-search",
                suggest: "#builder-suggestions",
                count: "#builder-search-count",
                none: "#builder-no-results",
                items: ".search-item",
                text: "td, .card-title, .card-text",
                noun: "results",
                suggestions: function () {
                    const list = [];
                    $(".search-item").each(function () {
                        const $item = $(this);
                        if ($item.is("tr")) {
                            list.push({ text: $item.children("td").eq(0).text().trim(), type: "Category" });
                            $.each($item.children("td").eq(1).text().split("/"), function (i, part) {
                                list.push({ text: part.trim(), type: "Ingredient" });
                            });
                        } else {
                            list.push({ text: $item.find(".card-title").text().trim(), type: "Bowl" });
                        }
                    });
                    return list;
                }
            });

            setupSubmit("buildForm", "formSuccess", "#build-submit");

            $("#popular-bowls").on("click", ".card .btn", function () {
                const title = $(this).closest(".card").find(".card-title").text().trim();
                ui.toast("“" + title + "” added to your bowl summary", "success");
            });

            $("#toppings").on("change", "input", function () {
                const name = $(this).closest("label").clone().children().remove().end().text().trim();
                ui.toast(this.checked ? name + " added to your bowl" : name + " removed from your bowl",
                         this.checked ? "success" : "info");
            });

            $("#meal-base").on("change", function () {
                ui.toast("Base: " + $(this).find("option:selected").text(), "info");
            });

            $("#step-next").on("click", function () {
                if ($buildForm.find(".is-invalid").length) ui.toast("Please fix the highlighted fields.", "error");
            });

            $("#step-reset").on("click", function () {
                ui.toast("The form was reset", "info");
            });

            $("#copy-bowl-btn").on("click", function () {
                const text = "Food Craft bowl: " + $("#sum-name").text().trim() +
                    " | " + $("#sum-kcal").text().trim() + " kcal | " + $("#sum-price").text().trim() + " ₸";
                copyWithButton($(this), text, "Bowl summary copied");
            });
        }

        if ($orderForm.length) {
            // name of a menu row without the small price text
            function dishName($row) {
                return $row.children("span").first().clone().children().remove().end().text().trim();
            }

            setupSearch({
                input: "#menu-search",
                suggest: "#menu-suggestions",
                count: "#menu-search-count",
                none: "#menu-no-results",
                items: "#menu-list .menu-row",
                text: "span",
                noun: "dishes",
                suggestions: function () {
                    return $("#menu-list .menu-row").map(function () {
                        return { text: dishName($(this)), type: "Dish" };
                    }).get();
                }
            });

            setupSubmit("orderForm", "orderSuccess", "#orderForm button[type=submit]");

            $("#menu-list").on("click", "[data-add]", function () {
                ui.toast(dishName($(this).closest(".menu-row")) + " added to cart", "success");
            });

            document.getElementById("cart-list").addEventListener("click", function (event) {
                const button = event.target.closest("[data-remove]");
                if (!button) return;
                const name = $(button).siblings("span").text().split("×")[0].trim();
                ui.toast(name + " removed from cart", "info");
            }, true);

            $(document).on("click", "[data-delivery]", function () {
                ui.toast($(this).closest(".fc-card").find(".card-title").text().trim() + " selected", "success");
            });

            $("#zone-select").on("change", function () {
                ui.toast("Delivery zone: " + $(this).find("option:selected").text(), "info");
            });

            $("#order-reset").on("click", function () {
                ui.toast("The order form was reset", "info");
            });

            $("#copy-order-btn").on("click", function () {
                const lines = $("#cart-list [data-remove]").map(function () {
                    return "• " + $(this).siblings("span").text().trim();
                }).get();

                if (!lines.length) {
                    ui.toast("Your cart is empty. Add dishes first.", "error");
                    return;
                }
                const text = "Food Craft order\n" + lines.join("\n") +
                    "\nDelivery: " + $("#sum-delivery").text().trim() +
                    "\nSubtotal: " + $("#sum-sub").text().trim() +
                    "\nTotal: " + $("#sum-total").text().trim();
                copyWithButton($(this), text, "Order summary copied");
            });
        }
    });
})(window.jQuery);