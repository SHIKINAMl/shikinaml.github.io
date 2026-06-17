// Works page specific scripts

// 作品データ
const worksData = [
    {
        id: 1,
        title: "作品A",
        genre: "ジャンル",
        thumbnail: "PCスクリーンショット",
        technologies: ["使用技術1", "使用技術2", "使用技術3"],
        purpose: "目的",
        highlights: "工夫したポイント",
        learned: "学んだこと",
        url: "#"
    },
    {
        id: 2,
        title: "作品B",
        genre: "ジャンル",
        thumbnail: "PCスクリーンショット",
        technologies: ["使用技術1", "使用技術2", "使用技術3"],
        purpose: "目的",
        highlights: "工夫したポイント",
        learned: "学んだこと    ",
        url: "#"
    },
    {
        id: 3,
        title: "作品C",
        genre: "ジャンル",
        thumbnail: "PCスクリーンショット",
        technologies: ["使用技術1", "使用技術2", "使用技術3"],
        purpose: "目的",
        highlights: "工夫したポイント",
        learned: "学んだこと",
        url: "#"
    }
];

// DOM初期化
document.addEventListener("DOMContentLoaded", () => {
    renderWorkPanels();
    setupModalHandlers();
});

// パネルを動的生成
function renderWorkPanels() {
    const grid = document.getElementById("worksGrid");
    if (!grid) return;

    grid.innerHTML = worksData.map(work => `
        <div class="work-panel" data-work-id="${work.id}">
        <div class="work-panel-thumbnail">${work.thumbnail}</div>
        <div class="work-panel-title">${work.title}</div>
        <div class="work-panel-genre">${work.genre}</div>
        <div class="work-panel-tags">
            ${work.technologies.map(tech => `<span class="work-panel-tag">${tech}</span>`).join("")}
        </div>
        </div>
    `).join("");

    // クリックイベント
    document.querySelectorAll(".work-panel").forEach(panel => {
        panel.addEventListener("click", () => {
        const workId = parseInt(panel.dataset.workId);
        const work = worksData.find(w => w.id === workId);
        if (work) openModal(work);
        });
    });
    }

    // モーダルオープン
    function openModal(work) {
    const modal = document.getElementById("workModal");
    const modalBody = document.getElementById("modalBody");

    modalBody.innerHTML = `
        <h2>${work.title}</h2>
        <div class="work-modal-section">
        <strong>ジャンル</strong>
        <p>${work.genre}</p>
        </div>
        <div class="work-modal-section">
        <strong>作成のきっかけ・目的</strong>
        <p>${work.purpose}</p>
        </div>
        <div class="work-modal-section">
        <strong>工夫したポイント</strong>
        <p>${work.highlights}</p>
        </div>
        <div class="work-modal-section">
        <strong>学んだこと</strong>
        <p>${work.learned}</p>
        </div>
        <div class="work-modal-section">
        <strong>使用技術</strong>
        <div class="work-modal-tags">
            ${work.technologies.map(tech => `<span class="work-panel-tag">${tech}</span>`).join("")}
        </div>
        </div>
        ${work.url && work.url !== "#" ? `<div class="work-modal-section"><a href="${work.url}" class="text-link" target="_blank">サイトを表示</a></div>` : ""}
    `;

    modal.style.display = "flex";
    }

    // モーダルクローズ
    function closeModal() {
    const modal = document.getElementById("workModal");
    modal.style.display = "none";
    }

    // モーダルハンドラー設定
    function setupModalHandlers() {
    const modal = document.getElementById("workModal");
    const overlay = document.getElementById("modalOverlay");
    const closeBtn = document.getElementById("modalClose");

    if (overlay) overlay.addEventListener("click", closeModal);
    if (closeBtn) closeBtn.addEventListener("click", closeModal);

    // Escキーで閉じる
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeModal();
    });
}

