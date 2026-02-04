// ────────────────────────────────────────────────
// VARIABLEN
// ────────────────────────────────────────────────
let cookies = 0;
let cookiesPerSecond = 0;
let clickValue = 1;
let achievements = [];
let lastMilestoneBots = 0;
let lastMilestoneSuffix = 0;
let lastSaveTime = 0;
const SAVE_INTERVAL = 5000; // Speichern alle 5 Sekunden

const cookieDisplay = document.getElementById('cookie-counter');
const cpsDisplay = document.getElementById('cps-counter');
const bigCookie = document.getElementById('bigCookie');
const upgradesDiv = document.getElementById('upgrades');
const aiGenerateBtn = document.getElementById('ai-generate');
const resetBtn = document.getElementById('reset-game');
const achievementsDiv = document.getElementById('achievements');
const goldenCookie = document.getElementById('golden-cookie');

// ────────────────────────────────────────────────
// INITIAL UPGRADES (Fallback beim ersten Start)
// ────────────────────────────────────────────────
const initialUpgrades = [
    { name: "Flavortown Cursor", baseCost: 15, cps: 0.1, owned: 0 },
    { name: "Finger Lickin' Hacker", baseCost: 100, cps: 1, owned: 0 },
    { name: "Dino's BBQ Bot", baseCost: 1100, cps: 8, owned: 0 },
    { name: "Flavor Farm Frenzy", baseCost: 12000, cps: 47, owned: 0 },
    { name: "Spice Rack Miner", baseCost: 130000, cps: 260, owned: 0 },
    { name: "Triple D Factory", baseCost: 1400000, cps: 1400, owned: 0 },
    { name: "Guy's AI Grill Swarm", baseCost: 20000000, cps: 7800, owned: 0 },
    { name: "Quantum Flavor Blaster", baseCost: 330000000, cps: 44000, owned: 0 },
    { name: "Space Station Sizzle", baseCost: 5100000000, cps: 260000, owned: 0 },
    { name: "Time Warp Tasty Portal", baseCost: 75000000000, cps: 1400000, owned: 0 }
];

let upgradesData = initialUpgrades.slice(); // Kopie

const aiBotNames = [
    "Flavor Fusion Bot", "Spicy Hackatron", "Burger Byte Blaster", "Pizza Pixel Pulverizer",
    "Taco Time Traveler", "Donut Dimension Devourer", "Fries Frequency Fryer", "Shakebot Supreme",
    "Wing Wizard", "Nachos Nebula Nommer", "Ramen Reactor", "Sushi Swarm Hacker",
    "Kebab Quantum Kicker", "Pancake Portal Punisher", "Waffle Warp Worker", "Churro Chrono Crusher",
    "Falafel Flux Factory", "Boba Black Hole", "Schnitzel Singularity", "Curry Cosmic Cruncher"
];
let aiBotIndex = 0;

// ────────────────────────────────────────────────
// SPEICHER-FUNKTIONEN
// ────────────────────────────────────────────────
function saveGame() {
    const saveData = {
        cookies: cookies,
        upgradesData: upgradesData,
        aiBotIndex: aiBotIndex,
        achievements: achievements,
        lastMilestoneBots: lastMilestoneBots,
        lastMilestoneSuffix: lastMilestoneSuffix,
        timestamp: Date.now()
    };
    localStorage.setItem('flavortownSave', JSON.stringify(saveData));
}

function loadGame() {
    try {
        const save = localStorage.getItem('flavortownSave');
        if (save) {
            const data = JSON.parse(save);
            cookies = data.cookies || 0;
            upgradesData = data.upgradesData || initialUpgrades.slice();
            aiBotIndex = data.aiBotIndex || 0;
            achievements = data.achievements || [];
            lastMilestoneBots = data.lastMilestoneBots || 0;
            lastMilestoneSuffix = data.lastMilestoneSuffix || 0;

            // CPS neu berechnen (für Konsistenz)
            cookiesPerSecond = 0;
            upgradesData.forEach(u => {
                cookiesPerSecond += u.owned * u.cps;
            });

            console.log('Spiel geladen! 🍪');
            return true;
        }
    } catch (e) {
        console.error('Fehler beim Laden:', e);
    }
    return false;
}

function resetGame() {
    if (confirm('Wirklich neustarten? Alle Fortschritte gehen verloren!')) {
        localStorage.removeItem('flavortownSave');
        location.reload();
    }
}

// ────────────────────────────────────────────────
// ZAHLEN-ABKÜRZUNG (unverändert)
// ────────────────────────────────────────────────
function suffixForTier(tier) {
    let s = '';
    tier = Math.floor(tier);
    if (tier === 0) return '';
    while (tier > 0) {
        tier -= 1;
        s = String.fromCharCode(97 + (tier % 26)) + s;
        tier = Math.floor(tier / 26);
    }
    return s;
}

function abbreviate(num) {
    num = Math.floor(num);
    if (num < 1000) return num.toLocaleString();
    const log = Math.log10(num);
    const tier = Math.floor(log / 3);
    const mant = num / Math.pow(10, tier * 3);
    const suf = suffixForTier(tier);
    let mantStr = mant.toFixed(2).replace(/\.?0+$/, '');
    return mantStr + suf;
}

function getTier(num) {
    if (num < 1000) return 0;
    return Math.floor(Math.log10(num) / 3);
}

function formatCps(num) {
    if (num === 0) return '0';
    if (num < 1000) return num.toLocaleString(undefined, {maximumFractionDigits: 1});
    return abbreviate(num);
}

// ────────────────────────────────────────────────
// PREIS BERECHNEN (unverändert)
// ────────────────────────────────────────────────
function getUpgradeCost(upgrade) {
    return Math.ceil(upgrade.baseCost * Math.pow(1.15, upgrade.owned));
}

function getAIGenerateCost() {
    return Math.ceil(1000000 * Math.pow(1.85, aiBotIndex));
}

// ────────────────────────────────────────────────
// RENDER & UPDATE (unverändert + save)
// ────────────────────────────────────────────────
function renderUpgrades() {
    upgradesDiv.innerHTML = '';
    upgradesData.forEach((upgrade, i) => {
        const cost = getUpgradeCost(upgrade);
        const el = document.createElement('div');
        el.className = 'upgrade' + (cookies < cost ? ' locked' : '');
        el.innerHTML = `
            <div class="name">${upgrade.name}</div>
            <div class="cost">Kosten: ${abbreviate(cost)} 🍪</div>
            <div class="cps">+${formatCps(upgrade.cps)} cps</div>
            <div class="owned">Besessen: ${upgrade.owned}</div>
        `;
        el.onclick = () => buyUpgrade(i);
        upgradesDiv.appendChild(el);
    });
}

function buyUpgrade(index) {
    const upgrade = upgradesData[index];
    const cost = getUpgradeCost(upgrade);
    if (cookies < cost) return;
    cookies -= cost;
    upgrade.owned++;
    cookiesPerSecond += upgrade.cps;
    updateDisplays();
    renderUpgrades();
    checkMilestoneAchievements();
    saveGame(); // ← NEU: Speichern nach Kauf
}

function updateDisplays() {
    cookieDisplay.textContent = abbreviate(cookies) + " cookies";
    cpsDisplay.textContent = formatCps(cookiesPerSecond) + " cookies pro Sekunde";

    const aiCost = getAIGenerateCost();
    aiGenerateBtn.textContent = `AI: Neuen Flavor Bot generieren! (${abbreviate(aiCost)} 🍪)`;
    aiGenerateBtn.className = cookies >= aiCost ? '' : 'locked';
}

// ────────────────────────────────────────────────
// KLICK & AUTO (mit throttled save)
// ────────────────────────────────────────────────
bigCookie.onclick = () => {
    cookies += clickValue;
    updateDisplays();
    renderUpgrades();
    checkMilestoneAchievements();
    // Speichern nur alle 10 Klicks (Performance)
    if (Math.random() < 0.1) saveGame();
};

setInterval(() => {
    cookies += cookiesPerSecond;
    updateDisplays();
    renderUpgrades();
    checkMilestoneAchievements();

    // Speichern alle 5 Sekunden
    const now = Date.now();
    if (now - lastSaveTime > SAVE_INTERVAL) {
        saveGame();
        lastSaveTime = now;
    }
}, 1000);

// ────────────────────────────────────────────────
// AI BOT KAUFEN (mit save)
// ────────────────────────────────────────────────
aiGenerateBtn.onclick = () => {
    const cost = getAIGenerateCost();
    if (cookies < cost) return;

    cookies -= cost;

    const power = Math.pow(2.3, aiBotIndex);
    const newBot = {
        name: aiBotNames[aiBotIndex % aiBotNames.length] + " Mk" + (Math.floor(aiBotIndex / aiBotNames.length) + 1),
        baseCost: 80000000 * power,
        cps: 400000 * power,
        owned: 0
    };

    upgradesData.push(newBot);
    aiBotIndex++;

    renderUpgrades();
    updateDisplays();
    checkMilestoneAchievements();
    saveGame(); // ← NEU: Speichern nach AI
};

// ────────────────────────────────────────────────
// RESET BUTTON
// ────────────────────────────────────────────────
resetBtn.onclick = resetGame;

// ────────────────────────────────────────────────
// ERFOLGE (unverändert)
// ────────────────────────────────────────────────
function addAchievement(text) {
    if (achievements.includes(text)) return;
    achievements.push(text);
    const el = document.createElement('div');
    el.className = 'achievement';
    el.textContent = text;
    achievementsDiv.appendChild(el);
}

function checkMilestoneAchievements() {
    // Feste Meilensteine
    const milestones = [
        {c: cookies >= 100,          t: "Erste 100 Cookies – Welcome to Flavortown!"},
        {c: cookies >= 1000,         t: "1a Cookies – du bist jetzt hungrig!"},
        {c: cookies >= 1e6,          t: "1b Cookies – Million Flavor Master!"},
        {c: cookies >= 1e9,          t: "1c Cookies – Milliardär der Aromen!"},
        {c: cookies >= 1e12,         t: "1d Cookies – Restaurant-Käufer!"},
        {c: cookiesPerSecond >= 100, t: "100 cps – Spice King!"},
        {c: cookiesPerSecond >= 1e6, t: "1b cps – Flavor Overdrive!"},
    ];

    milestones.forEach(m => { if (m.c) addAchievement(m.t); });

    // AI-Bot Meilensteine
    const botMilestones = [5,10,20,50,100,250,500,1000,2500,5000,10000,25000,50000,100000];
    for (let goal of botMilestones) {
        if (aiBotIndex >= goal && lastMilestoneBots < goal) {
            addAchievement(`${goal} AI Flavor Bots freigeschaltet – du bist eine Legende! 🔥🤖`);
            lastMilestoneBots = goal;
            break;
        }
    }

    // Neue Suffix-Stufe
    const currentTier = getTier(cookies);
    if (currentTier > lastMilestoneSuffix) {
        const newSuffix = suffixForTier(currentTier);
        addAchievement(`Neue Größenordnung erreicht – ${newSuffix} Cookies! 🍪∞`);
        lastMilestoneSuffix = currentTier;
    }
}

// ────────────────────────────────────────────────
// GOLDEN COOKIE (unverändert)
// ────────────────────────────────────────────────
function spawnGoldenCookie() {
    const x = Math.random() * (window.innerWidth - 220);
    const y = Math.random() * (window.innerHeight - 220);
    goldenCookie.style.left = x + 'px';
    goldenCookie.style.top = y + 'px';
    goldenCookie.style.display = 'block';
    setTimeout(() => goldenCookie.style.display = 'none', 10000);
}

goldenCookie.onclick = () => {
    const bonus = Math.floor(Math.random() * 50000) + 5000;
    cookies += bonus;
    updateDisplays();
    goldenCookie.style.display = 'none';
    addAchievement(`Golden Cookie! +${abbreviate(bonus)} Cookies 🌟`);
    saveGame(); // ← NEU: Nach Golden Cookie
};

setInterval(spawnGoldenCookie, 40000 + Math.random()*60000);

// ────────────────────────────────────────────────
// AUTO-SPEICHER BEIM SCHLIESSEN
// ────────────────────────────────────────────────
window.onbeforeunload = saveGame;

// ────────────────────────────────────────────────
// START: LADEN & INITIALISIEREN
// ────────────────────────────────────────────────
loadGame();
renderUpgrades();
updateDisplays();
checkMilestoneAchievements();
saveGame(); // Erstes Save nach Laden
