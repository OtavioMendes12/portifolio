/* =========================================================
   CORE_OS — app logic: panel routing, typing terminals, mobile nav
   ========================================================= */
(function () {
    "use strict";

    var PANELS = ["home", "projects", "logs", "io"];

    var panelEls = {};
    PANELS.forEach(function (id) {
        panelEls[id] = document.getElementById(id);
    });

    var navLinks = document.querySelectorAll("[data-panel]");
    var hamburger = document.getElementById("hamburger");
    var topnav = document.getElementById("topnav");

    function setActivePanel(id, updateHash) {
        if (PANELS.indexOf(id) === -1) id = "home";

        PANELS.forEach(function (p) {
            panelEls[p].classList.toggle("active-panel", p === id);
        });

        navLinks.forEach(function (link) {
            link.classList.toggle("active", link.dataset.panel === id);
        });

        if (updateHash !== false) {
            history.replaceState(null, "", "#" + id);
        }

        document.getElementById("main-content").scrollTop = 0;
        runPanelEffects(id);
        closeMobileMenu();
    }

    navLinks.forEach(function (link) {
        link.addEventListener("click", function (e) {
            e.preventDefault();
            setActivePanel(link.dataset.panel);
        });
    });

    function openMobileMenu() {
        topnav.classList.add("open");
        hamburger.setAttribute("aria-expanded", "true");
    }
    function closeMobileMenu() {
        topnav.classList.remove("open");
        hamburger.setAttribute("aria-expanded", "false");
    }
    hamburger.addEventListener("click", function () {
        topnav.classList.contains("open") ? closeMobileMenu() : openMobileMenu();
    });

    window.addEventListener("hashchange", function () {
        setActivePanel(location.hash.replace("#", ""), false);
    });

    /* ---------------- typing terminal effect ---------------- */
    function typeLines(targetId, lines, opts) {
        var el = document.getElementById(targetId);
        if (!el || el.dataset.done === "1") return;
        el.dataset.done = "1";
        el.innerHTML = "";

        var speed = (opts && opts.speed) || 12;
        var lineIndex = 0;
        var charIndex = 0;
        var currentLine;

        function nextLine() {
            if (lineIndex >= lines.length) {
                var cursor = document.createElement("span");
                cursor.className = "cursor";
                el.appendChild(cursor);
                return;
            }
            currentLine = document.createElement("span");
            currentLine.className = "term-line " + (lines[lineIndex].cls || "term-dim");
            el.appendChild(currentLine);
            charIndex = 0;
            typeChar();
        }

        function typeChar() {
            var text = lines[lineIndex].text;
            if (text === "") {
                currentLine.innerHTML = "&nbsp;";
                lineIndex++;
                setTimeout(nextLine, speed * 4);
                return;
            }
            if (charIndex <= text.length) {
                currentLine.textContent = text.slice(0, charIndex);
                charIndex++;
                setTimeout(typeChar, speed);
            } else {
                lineIndex++;
                setTimeout(nextLine, lines[lineIndex - 1].pause || 120);
            }
        }

        nextLine();
    }

    var HOME_LINES = [
        { text: "whoami", cls: "term-prompt", pause: 300 },
        { text: "OTÁVIO MENDES — Mid-Level Fullstack Developer @ itexto Consultoria", cls: "term-green" },
        { text: "Java, Spring Boot, Go & Python | APIs, microservices, cloud-native systems.", cls: "term-dim" },
        { text: "" },
        { text: "run architecture_audit --verbose", cls: "term-prompt", pause: 300 },
        { text: "Executing global audit...", cls: "term-dim" },
        { text: "Scanning distributed nodes [####################] 100%", cls: "term-dim" },
        { text: "Audit Complete: 0 Vulnerabilities. Performance exceeding baseline.", cls: "term-green" }
    ];

    var PROJECTS_LINES = [
        { text: "> system_status --check all_modules", cls: "term-green" },
        { text: "Checking integrity... [ OK ]", cls: "term-dim" },
        { text: "Verifying dependencies... [ OK ]", cls: "term-dim" },
        { text: "> fetch project_metadata --active", cls: "term-green" },
        { text: "Retrieving active module manifests for ARCH_01...", cls: "term-dim" },
        { text: "5 modules loaded. 0 errors.", cls: "term-accent" }
    ];

    var LOGS_LINES = [
        { text: ">> INITIALIZING SYSTEM_LOG_SCRAPER...", cls: "term-accent" },
        { text: "Parsing repository: itexto_consultoria/main", cls: "term-dim" },
        { text: "Deploying microservice update via Terraform...", cls: "term-dim" },
        { text: "Status: Spring Boot container initialized on K8s cluster.", cls: "term-dim" },
        { text: "SUCCESS: Cloud resource optimization verified. Savings: $700/mo.", cls: "term-green" },
        { text: ">> MONITORING REAL-TIME TRAFFIC...", cls: "term-accent" }
    ];

    var IO_LINES = [
        { text: "> establish_connection --secure", cls: "term-green" },
        { text: "Handshake... [ OK ]", cls: "term-dim" },
        { text: "Encrypting channel (AES-256)... [ OK ]", cls: "term-dim" },
        { text: "Awaiting incoming transmission from visitor...", cls: "term-accent" }
    ];

    function animateBars() {
        document.querySelectorAll(".bar-fill").forEach(function (bar) {
            requestAnimationFrame(function () {
                bar.classList.add("filled");
            });
        });
    }

    function runPanelEffects(id) {
        if (id === "home") typeLines("terminal-body", HOME_LINES);
        if (id === "projects") typeLines("terminal-body-projects", PROJECTS_LINES, { speed: 8 });
        if (id === "logs") {
            typeLines("terminal-body-logs", LOGS_LINES, { speed: 8 });
            animateBars();
        }
        if (id === "io") typeLines("terminal-body-io", IO_LINES, { speed: 10 });
    }

    /* ---------------- init ---------------- */
    var initial = location.hash.replace("#", "") || "home";
    setActivePanel(initial, false);
})();
