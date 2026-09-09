const els = {
  hud: document.getElementById("hud"),
  hpFill: document.getElementById("hp-fill"),
  hpText: document.getElementById("hp-text"),
  xpFill: document.getElementById("xp-fill"),
  xpText: document.getElementById("xp-text"),
  levelText: document.getElementById("level-text"),
  killsText: document.getElementById("kills-text"),
  start: document.getElementById("start-screen"),
  levelup: document.getElementById("levelup-screen"),
  cards: document.getElementById("upgrade-cards"),
  gameover: document.getElementById("gameover-screen"),
  gameoverStats: document.getElementById("gameover-stats"),
  btnStart: document.getElementById("btn-start"),
  btnRetry: document.getElementById("btn-retry"),
};

function show(el) {
  el.classList.remove("hidden");
}

function hide(el) {
  el.classList.add("hidden");
}

export function bindUiHandlers({ onStart, onRetry, onSelectUpgrade }) {
  els.btnStart.addEventListener("click", onStart);
  els.btnRetry.addEventListener("click", onRetry);
  els.cards.addEventListener("click", (e) => {
    const card = e.target.closest(".card");
    if (!card) return;
    const index = Number(card.dataset.index);
    onSelectUpgrade(index);
  });
}

export function showStart() {
  hide(els.hud);
  hide(els.levelup);
  hide(els.gameover);
  show(els.start);
}

export function showPlaying() {
  hide(els.start);
  hide(els.levelup);
  hide(els.gameover);
  show(els.hud);
}

export function showLevelUp(upgrades) {
  show(els.levelup);
  els.cards.innerHTML = upgrades
    .map(
      (u, i) => `
      <button class="card" type="button" data-index="${i}">
        <span class="key">${i + 1}</span>
        <div class="title">${u.title}</div>
        <div class="desc">${u.desc}</div>
      </button>`
    )
    .join("");
}

export function hideLevelUp() {
  hide(els.levelup);
  els.cards.innerHTML = "";
}

export function showGameOver(player) {
  hide(els.levelup);
  show(els.gameover);
  els.gameoverStats.textContent = `Level ${player.level} · Kills ${player.kills} · XP ${player.xp}`;
}

export function updateHud(player) {
  const hpRatio = player.maxHp > 0 ? player.hp / player.maxHp : 0;
  const xpRatio = player.xpToNext > 0 ? player.xp / player.xpToNext : 0;

  els.hpFill.style.transform = `scaleX(${Math.max(0, Math.min(1, hpRatio))})`;
  els.xpFill.style.transform = `scaleX(${Math.max(0, Math.min(1, xpRatio))})`;
  els.hpText.textContent = `${Math.ceil(player.hp)}/${player.maxHp}`;
  els.xpText.textContent = `${player.xp}/${player.xpToNext}`;
  els.levelText.textContent = String(player.level);
  els.killsText.textContent = String(player.kills);
}
