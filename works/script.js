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

    renderStatus("作品一覧を読み込み中です...");

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
    const techList = parseList(raw.tech);
    const tagList = parseList(raw.tags);
    const linkList = normalizeLinks(raw.links);
    return {
        id: index + 1,
        title: String(raw.title || "Untitled"),
        summary: String(raw.summary || ""),
        story: String(raw.story || ""),
        craft: String(raw.craft || ""),
        role: String(raw.role || ""),
        tech: techList,
        links: linkList,
        tags: tagList,
        url: String(raw.url || ""),
        imageUrl: String(raw.imageUrl || ""),
        date: String(raw.date || ""),
    };
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

    grid.innerHTML = `<p class="works-status${isError ? " is-error" : ""}">${escapeHtml(message)}</p>`;
}

function renderWorkPanels() {
    const grid = document.getElementById("worksGrid");
    if (!grid) {
        return;
    }

    grid.innerHTML = worksData
        .map(
            (work) => `
                <div class="work-panel" data-work-id="${work.id}">
                    <div class="work-panel-thumbnail">
                        ${
                            work.imageUrl
                                ? `<img src="${escapeHtml(work.imageUrl)}" alt="${escapeHtml(work.title)} のサムネイル" loading="lazy" />`
                                : "画像なし"
                        }
                    </div>
                    <div class="work-panel-title">${escapeHtml(work.title)}</div>
                    <div class="work-panel-genre">${escapeHtml(work.summary || "概要未設定")}</div>
                    <div class="work-panel-tags">
                        ${[...work.tech, ...work.tags]
                            .slice(0, 5)
                            .map((tag) => `<span class="work-panel-tag">${escapeHtml(tag)}</span>`)
                            .join("")}
                    </div>
                </div>
            `
        )
        .join("");

    document.querySelectorAll(".work-panel").forEach((panel) => {
        panel.addEventListener("click", () => {
            const workId = Number(panel.dataset.workId);
            const work = worksData.find((item) => item.id === workId);
            if (work) {
                openModal(work);
            }
        });
    });
}

function openModal(work) {
    const modal = document.getElementById("workModal");
    const modalBody = document.getElementById("modalBody");
    if (!modal || !modalBody) {
        return;
    }

    modalBody.innerHTML = `
        <div class="work-modal-layout">
            <div class="work-modal-top">
                <h2>${escapeHtml(work.title)}</h2>
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
                ${work.story ? `<div class="work-modal-section"><strong>制作にあたって</strong><p>${escapeHtml(work.story)}</p></div>` : ""}
                ${work.craft ? `<div class="work-modal-section"><strong>工夫やこだわり</strong><p>${escapeHtml(work.craft)}</p></div>` : ""}
            </div>
            <div class="work-modal-meta">
                <div class="work-modal-pair-grid">
                    ${work.role ? `<div class="work-modal-section"><strong>担当範囲</strong><p>${escapeHtml(work.role)}</p></div>` : ""}
                    ${work.date ? `<div class="work-modal-section"><strong>開発期間</strong><p>${escapeHtml(work.date)}</p></div>` : ""}
                </div>
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

    modal.style.display = "flex";
}

function closeModal() {
    const modal = document.getElementById("workModal");
    if (!modal) {
        return;
    }

    modal.style.display = "none";
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

