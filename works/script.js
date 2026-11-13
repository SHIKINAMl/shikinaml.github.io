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
    };
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

    modalTitle.textContent = work.title;

    modalBody.innerHTML = `
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

    const closeBtn = document.getElementById("modalClose");
    if (closeBtn) {
        closeBtn.focus();
    }
}

function closeModal() {
    const modal = document.getElementById("workModal");
    if (!modal || modal.style.display === "none") {
        return;
    }

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

