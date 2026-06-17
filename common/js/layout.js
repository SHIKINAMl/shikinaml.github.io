async function loadPartials() {
    const targets = Array.from(document.querySelectorAll("[data-include]"));

    await Promise.all(
        targets.map(async (target) => {
            const includePath = target.getAttribute("data-include");
            if (!includePath) {
                return;
            }

            try {
                const response = await fetch(includePath);
                if (!response.ok) {
                    throw new Error(`Failed to load partial: ${includePath}`);
                }
                target.innerHTML = await response.text();
            } catch (error) {
                console.error(error);
                target.innerHTML = "";
            }
        })
    );
}

function initCommonUi() {
    const year = document.getElementById("year");
    if (year) {
        year.textContent = new Date().getFullYear();
    }

    const pageKey = document.body.dataset.page;
    if (pageKey) {
        const current = document.querySelector(`[data-nav="${pageKey}"]`);
        if (current) {
            current.classList.add("is-current");
            current.setAttribute("aria-current", "page");
        }
    }

    const menuToggle = document.querySelector(".menu-toggle");
    const globalNav = document.getElementById("global-nav");

    if (menuToggle && globalNav) {
        menuToggle.addEventListener("click", () => {
            const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
            menuToggle.setAttribute("aria-expanded", String(!isExpanded));
            globalNav.classList.toggle("is-open", !isExpanded);
        });

        globalNav.querySelectorAll("a").forEach((link) => {
            link.addEventListener("click", () => {
                menuToggle.setAttribute("aria-expanded", "false");
                globalNav.classList.remove("is-open");
            });
        });
    }
}

async function initPage() {
    // Font Awesome CDNを読み込み
    loadFontAwesome();
    
    await loadPartials();
    initCommonUi();
}

function loadFontAwesome() {
    // 既に読み込まれているか確認
    if (document.querySelector('link[rel="stylesheet"][href*="fontawesome"]')) {
        return;
    }
    
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";
    document.head.appendChild(link);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPage);
} else {
    initPage();
}
