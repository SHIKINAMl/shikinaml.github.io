// Set your deployed GAS Web App URL here.
const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzDPYAze5wvvt-4CNZUQ7LSZNLAtIB_74_TMsvKcZiz1oRaosQJcocEU07aFd4Qef_yDw/exec";

let worksData = [];

document.addEventListener("DOMContentLoaded", async () => {
    setupModalHandlers();
    await loadWorks();
});

async function loadWorks() {
    const grid = document.getElementById("worksGrid");
    if (!grid) {
        return;
    }

    renderSkeleton(3);

    try {
        const endpoint = `${GAS_WEB_APP_URL}${GAS_WEB_APP_URL.includes("?") ? "&" : "?"}action=works`;
        const response = await fetch(endpoint, { method: "GET" });
        const result = await response.json();

        if (!response.ok || !result.ok || !Array.isArray(result.items)) {
            throw new Error("invalid response");
        }

        worksData = result.items.map((item, index) => normalizeWorkItem(item, index));

        if (worksData.length === 0) {
            renderStatus("登録されている作品はまだありません。", true);
            return;
        }

        renderWorkPanels();
    } catch (error) {
        console.error(error);
        renderStatus("作品一覧を取得できませんでした。時間をおいて再度お試しください。", true);
    }
}

function normalizeWorkItem(raw, index) {
    const roleList = parseList(raw.role);
    const techList = parseList(raw.tech);
    const tagList = parseList(raw.tags);
    const linkList = normalizeLinks(raw.links);
    const imageSrc = normalizeImageSource(raw.imageUrl);
    return {
        id: index + 1,
        title: String(raw.title || "Untitled"),
        summary: String(raw.summary || ""),
        story: String(raw.story || ""),
        craft: String(raw.craft || ""),
        role: roleList,
        tech: techList,
        links: linkList,
        tags: tagList,
        url: String(raw.url || ""),
        imageUrl: imageSrc,
        date: String(raw.date || ""),
        playUrl: detectPlayUrl(raw.embedUrl, linkList),
    };
}

// GitHub Pages で公開されている作品はポートフォリオ内で遊べるようにする。
// シートに embedUrl 列があればそれを優先し、なければリンクの中から *.github.io の URL を探す。
function detectPlayUrl(explicitUrl, links) {
    const candidates = [String(explicitUrl || "").trim(), ...links.map((link) => String(link.url || "").trim())];

    for (const candidate of candidates) {
        if (!candidate) {
            continue;
        }

        let url;
        try {
            url = new URL(candidate);
        } catch (error) {
            continue;
        }

        const host = url.hostname.toLowerCase();
        const isPages = url.protocol === "https:" && host.endsWith(".github.io");
        const isPortfolioRoot = url.pathname === "/" || url.pathname === "";
        if (isPages && !isPortfolioRoot) {
            url.hostname = host;
            if (!url.pathname.endsWith("/") && !/\.[a-z0-9]+$/i.test(url.pathname)) {
                url.pathname += "/";
            }
            return url.toString();
        }
    }

    return "";
}

function normalizeImageSource(value) {
    const raw = String(value || "").trim();
    if (!raw) {
        return "";
    }

    // Keep explicit URLs for backward compatibility.
    if (/^https?:\/\//i.test(raw)) {
        return raw;
    }

    // Treat non-URL values as Google Drive file IDs.
    return `https://drive.google.com/thumbnail?id=${encodeURIComponent(raw)}&sz=w1200`;
}

function parseList(value) {
    return String(value || "")
        .split(/[、,\n]/)
        .map((item) => item.trim())
        .filter(Boolean);
}

function normalizeLinks(value) {
    const text = String(value || "").trim();
    if (!text) {
        return [];
    }

    return text
        .split(/[\n,]/)
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => {
            const [label, url] = part.split("|").map((item) => item.trim());
            return label || url ? { label, url } : null;
        })
        .filter(Boolean);
}

function renderStatus(message, isError = false) {
    const grid = document.getElementById("worksGrid");
    if (!grid) {
        return;
    }

    grid.removeAttribute("aria-busy");
    grid.innerHTML = `<p class="works-status${isError ? " is-error" : ""}">${escapeHtml(message)}</p>`;
}

function renderSkeleton(count) {
    const grid = document.getElementById("worksGrid");
    if (!grid) {
        return;
    }

    grid.setAttribute("aria-busy", "true");
    grid.innerHTML = Array.from({ length: count })
        .map(
            () => `
                <div class="work-skeleton" aria-hidden="true">
                    <div class="work-skeleton-thumb"></div>
                    <div class="work-skeleton-body">
                        <div class="work-skeleton-line is-title"></div>
                        <div class="work-skeleton-line"></div>
                        <div class="work-skeleton-line is-short"></div>
                    </div>
                </div>
            `
        )
        .join("");
}

function renderWorkPanels() {
    const grid = document.getElementById("worksGrid");
    if (!grid) {
        return;
    }

    grid.removeAttribute("aria-busy");
    grid.innerHTML = worksData
        .map(
            (work) => `
                <div class="work-panel" data-work-id="${work.id}" role="button" tabindex="0" aria-label="${escapeHtml(work.title)} の詳細を開く">
                    <div class="work-panel-thumbnail">
                        ${
                            work.imageUrl
                                ? `<img src="${escapeHtml(work.imageUrl)}" alt="${escapeHtml(work.title)} のサムネイル" loading="lazy" />`
                                : "画像なし"
                        }
                        ${work.playUrl ? `<span class="work-panel-badge">ブラウザで遊べる</span>` : ""}
                    </div>
                    <div class="work-panel-body">
                        <div class="work-panel-title">${escapeHtml(work.title)}</div>
                        <div class="work-panel-genre">${escapeHtml(work.summary || "概要未設定")}</div>
                        <div class="work-panel-tags">
                            ${[...work.tech, ...work.tags]
                                .slice(0, 5)
                                .map((tag) => `<span class="work-panel-tag">${escapeHtml(tag)}</span>`)
                                .join("")}
                        </div>
                    </div>
                </div>
            `
        )
        .join("");

    document.querySelectorAll(".work-panel").forEach((panel) => {
        const open = () => {
            const workId = Number(panel.dataset.workId);
            const work = worksData.find((item) => item.id === workId);
            if (work) {
                openModal(work, panel);
            }
        };
        panel.addEventListener("click", open);
        panel.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                open();
            }
        });
    });
}

let lastFocusedPanel = null;

function openModal(work, trigger = null) {
    const modal = document.getElementById("workModal");
    const modalBody = document.getElementById("modalBody");
    const modalTitle = document.getElementById("modalTitle");
    if (!modal || !modalBody || !modalTitle) {
        return;
    }

    stopPlay();
    modalTitle.textContent = work.title;

    modalBody.innerHTML = `
        ${work.playUrl ? renderPlaySection(work) : ""}
        <div class="work-modal-layout">
            <div class="work-modal-top">
                ${
                    work.imageUrl
                        ? `
                            <div class="work-modal-media">
                                <img src="${escapeHtml(work.imageUrl)}" alt="${escapeHtml(work.title)} のサムネイル" loading="lazy" />
                            </div>
                        `
                        : ""
                }
            </div>
            <div class="work-modal-main">
                ${work.summary ? `<div class="work-modal-section"><strong>概要</strong><p>${escapeHtml(work.summary)}</p></div>` : ""}
                ${renderNarrativeSection("工夫やこだわり", work.craft, { alwaysShow: true })}
                ${renderNarrativeSection("制作にあたって", work.story, { alwaysShow: true })}

            </div>
            <div class="work-modal-meta">
                ${
                    work.links.length
                        ? `<div class="work-modal-section"><strong>リンク</strong><div class="work-link-list">${work.links
                              .map((link) => {
                                  const label = escapeHtml(link.label || "Link");
                                  const url = escapeHtml(link.url || "");
                                  return url
                                      ? `<a class="work-link-item" href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`
                                      : `<span class="work-link-item is-text">${label}</span>`;
                              })
                              .join("")}</div></div>`
                        : ""
                }
                <div class="work-modal-pair-grid">
                    ${work.date ? `<div class="work-modal-section"><strong>開発期間</strong><p>${escapeHtml(work.date)}</p></div>` : ""}
                    ${
                        work.role.length
                            ? `<div class="work-modal-section work-modal-role"><strong>担当</strong><div class="work-modal-tags">${work.role
                                  .map((role) => `<span class="work-panel-tag">${escapeHtml(role)}</span>`)
                                  .join("")}</div></div>`
                            : ""
                    }
                </div>
                <div class="work-modal-pair-grid">
                    ${
                        work.tech.length
                            ? `<div class="work-modal-section"><strong>使用技術</strong><div class="work-modal-tags">${work.tech
                                  .map((tech) => `<span class="work-panel-tag">${escapeHtml(tech)}</span>`)
                                  .join("")}</div></div>`
                            : ""
                    }
                    ${
                        work.tags.length
                            ? `<div class="work-modal-section"><strong>タグ</strong><div class="work-modal-tags">${work.tags
                                  .map((tag) => `<span class="work-panel-tag">${escapeHtml(tag)}</span>`)
                                  .join("")}</div></div>`
                            : ""
                    }
                </div>
            </div>
        </div>
    `;

    lastFocusedPanel = trigger;
    modal.style.display = "flex";
    document.body.classList.add("modal-open");

    const playSection = modalBody.querySelector(".work-play");
    if (playSection) {
        setupPlaySection(playSection);
    }

    const closeBtn = document.getElementById("modalClose");
    if (closeBtn) {
        closeBtn.focus();
    }
}

/* ---------- ブラウザで遊ぶ（GitHub Pages の埋め込み） ---------- */

const DEFAULT_GAME_SIZE = { width: 960, height: 600 };
const gameSizeCache = new Map();
let playState = null;

function renderPlaySection(work) {
    const url = escapeHtml(work.playUrl);
    return `
        <section class="work-play" data-play-url="${url}" aria-label="${escapeHtml(work.title)} をブラウザで遊ぶ">
            <div class="work-play-stage" hidden></div>
            <div class="work-play-bar">
                <div class="work-play-info">
                    <strong>ブラウザで遊ぶ</strong>
                    <span class="work-play-note">Unity WebGL 版です。読み込みに少し時間がかかります（PC 推奨）。</span>
                </div>
                <div class="work-play-actions">
                    <button class="work-play-button is-primary" type="button" data-play-action="start">▶ プレイ開始</button>
                    <button class="work-play-button" type="button" data-play-action="fullscreen" hidden>全画面</button>
                    <button class="work-play-button" type="button" data-play-action="stop" hidden>停止</button>
                    <a class="work-play-button" href="${url}" target="_blank" rel="noopener noreferrer">別タブで開く</a>
                </div>
            </div>
        </section>
    `;
}

function setupPlaySection(section) {
    section.querySelectorAll("[data-play-action]").forEach((button) => {
        button.addEventListener("click", () => {
            const action = button.dataset.playAction;
            if (action === "start") {
                startPlay(section);
            } else if (action === "stop") {
                stopPlay();
            } else if (action === "fullscreen") {
                const stage = section.querySelector(".work-play-stage");
                if (stage && stage.requestFullscreen) {
                    stage.requestFullscreen().catch(() => {});
                }
            }
        });
    });
}

// Unity の WebGL テンプレートはキャンバスを固定ピクセルで置くため、ページからサイズを読み取って縮小表示する
async function fetchGameSize(url) {
    if (gameSizeCache.has(url)) {
        return gameSizeCache.get(url);
    }

    let size = DEFAULT_GAME_SIZE;
    try {
        const response = await fetch(url);
        const html = await response.text();
        const match = html.match(/<canvas[^>]*id=["']?unity-canvas["']?[^>]*>/i);
        if (match) {
            const width = Number((match[0].match(/width=["']?(\d+)/i) || [])[1]);
            const height = Number((match[0].match(/height=["']?(\d+)/i) || [])[1]);
            if (width > 0 && height > 0) {
                size = { width, height };
            }
        }
    } catch (error) {
        console.warn("ゲームのサイズを取得できなかったため既定値を使います", error);
    }

    gameSizeCache.set(url, size);
    return size;
}

async function startPlay(section) {
    stopPlay();

    const url = section.dataset.playUrl;
    const stage = section.querySelector(".work-play-stage");
    if (!url || !stage) {
        return;
    }

    section.classList.add("is-loading");
    stage.hidden = false;
    stage.innerHTML = `<p class="work-play-loading">ゲームを読み込んでいます...</p>`;

    const size = await fetchGameSize(url);

    const iframe = document.createElement("iframe");
    iframe.src = url;
    iframe.title = "ゲーム画面";
    iframe.width = String(size.width);
    iframe.height = String(size.height);
    iframe.setAttribute("scrolling", "no");
    iframe.setAttribute("allow", "fullscreen; autoplay; gamepad");
    iframe.setAttribute("allowfullscreen", "");
    iframe.addEventListener("load", () => section.classList.remove("is-loading"));

    stage.innerHTML = "";
    stage.appendChild(iframe);

    const fit = () => {
        const isFullscreen = document.fullscreenElement === stage;
        const availableWidth = stage.clientWidth;
        // 通常表示では縦長（4:3 など）のゲームがモーダルからはみ出さないよう、画面の高さの 65% までに抑える
        const availableHeight = isFullscreen ? stage.clientHeight : window.innerHeight * 0.65;
        const scale = Math.min(availableWidth / size.width, availableHeight / size.height);
        iframe.style.transform = `scale(${scale})`;
        iframe.style.left = `${Math.max(0, (availableWidth - size.width * scale) / 2)}px`;
        iframe.style.top = isFullscreen ? `${Math.max(0, (availableHeight - size.height * scale) / 2)}px` : "0px";
        if (!isFullscreen) {
            stage.style.height = `${size.height * scale}px`;
        }
    };

    const observer = new ResizeObserver(fit);
    observer.observe(stage);
    document.addEventListener("fullscreenchange", fit);
    window.addEventListener("resize", fit);
    fit();

    section.classList.add("is-playing");
    section.querySelector('[data-play-action="start"]').hidden = true;
    section.querySelector('[data-play-action="stop"]').hidden = false;
    section.querySelector('[data-play-action="fullscreen"]').hidden = !stage.requestFullscreen;

    playState = { section, stage, observer, fit };
}

function stopPlay() {
    if (!playState) {
        return;
    }

    const { section, stage, observer, fit } = playState;
    observer.disconnect();
    document.removeEventListener("fullscreenchange", fit);
    window.removeEventListener("resize", fit);
    if (document.fullscreenElement === stage && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
    }

    stage.innerHTML = "";
    stage.style.height = "";
    stage.hidden = true;
    section.classList.remove("is-playing", "is-loading");
    section.querySelector('[data-play-action="start"]').hidden = false;
    section.querySelector('[data-play-action="stop"]').hidden = true;
    section.querySelector('[data-play-action="fullscreen"]').hidden = true;
    playState = null;
}

function closeModal() {
    const modal = document.getElementById("workModal");
    if (!modal || modal.style.display === "none") {
        return;
    }

    stopPlay();
    modal.style.display = "none";
    document.body.classList.remove("modal-open");

    if (lastFocusedPanel) {
        lastFocusedPanel.focus();
        lastFocusedPanel = null;
    }
}

function setupModalHandlers() {
    const overlay = document.getElementById("modalOverlay");
    const closeBtn = document.getElementById("modalClose");

    if (overlay) {
        overlay.addEventListener("click", closeModal);
    }
    if (closeBtn) {
        closeBtn.addEventListener("click", closeModal);
    }

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeModal();
        }
    });
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function renderNarrativeSection(title, text, options = {}) {
    const { alwaysShow = false, emptyText = "未設定" } = options;
    const normalized = String(text || "").trim();
    if (!normalized) {
        if (!alwaysShow) {
            return "";
        }

        return `<div class="work-modal-section"><strong>${escapeHtml(title)}</strong><p>${escapeHtml(emptyText)}</p></div>`;
    }

    const items = normalized
        .split(/\r?\n+/)
        .map((item) => item.trim())
        .filter(Boolean);

    if (items.length <= 1) {
        return `<div class="work-modal-section"><strong>${escapeHtml(title)}</strong><p>${escapeHtml(normalized)}</p></div>`;
    }

    return `
        <div class="work-modal-section">
            <strong>${escapeHtml(title)}</strong>
            <ul class="work-modal-list">
                ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
            </ul>
        </div>
    `;
}

