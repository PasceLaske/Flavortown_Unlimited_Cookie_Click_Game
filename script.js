// ────────────────────────────────────────────────
// VARIABLEN
// ────────────────────────────────────────────────
let cookies = 0;
let cookiesPerSecond = 0;
let clickValue = 1;
let achievements = [];
let lastMilestoneBots = 0;
let lastMilestoneSuffix = 0;

const cookieDisplay = document.getElementById('cookie-counter');
const cpsDisplay = document.getElementById('cps-counter');
const bigCookie = document.getElementById('bigCookie');
const upgradesDiv = document.getElementById('upgrades');
const aiGenerateBtn = document.getElementById('ai-generate');
const resetBtn = document.getElementById('reset-game');
const achievementsDiv = document.getElementById('achievements');
const goldenCookie = document.getElementById('golden-cookie');

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
// UPGRADES + AI-BOTS (Initialwerte)
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

let upgradesData = [...initialUpgrades];
let aiBotIndex = 0;

const aiBotNames = [
    "Flavor Fusion Bot", "Spicy Hackatron", "Burger Byte Blaster", "Pizza Pixel Pulverizer",
    "Taco Time Traveler", "Donut Dimension Devourer", "Fries Frequency Fryer", "Shakebot Supreme",
    "Wing Wizard", "Nachos Nebula Nommer", "Ramen Reactor", "Sushi Swarm Hacker",
    "Kebab Quantum Kicker", "Pancake Portal Punisher", "Waffle Warp Worker", "Churro Chrono Crusher",
    "Falafel Flux Factory", "Boba Black Hole", "Schnitzel Singularity", "Curry Cosmic Cruncher"
];

// ────────────────────────────────────────────────
// SPEICHER-MANAGEMENT
// ────────────────────────────────────────────────
const SAVE_KEY = 'flavortownClickerSave_v1';

function saveGame() {
    const saveData = {
        cookies,
        upgradesData,
        aiBotIndex,
        achievements,
        lastMilestoneBots,
        lastMilestoneSuffix,
        timestamp: Date.now()
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
}

function loadGame() {
    const saved = localStorage.getItem(SAVE_KEY);
    if (!saved) return false;

    try {
        const data = JSON.parse(saved);
        cookies = Number(data.cookies) || 0;
        aiBotIndex = Number(data.aiBotIndex) || 0;
        achievements = Array.isArray(data.achievements) ? data.achievements : [];
        lastMilestoneBots = Number(data.lastMilestoneBots) || 0;
        lastMilestoneSuffix = Number(data.lastMilestoneSuffix) || 0;

        if (Array.isArray(data.upgradesData)) {
            upgradesData = data.upgradesData.map(u => ({
                ...u,
                owned: Number(u.owned) || 0,
                cps: Number(u.cps) || 0,
                baseCost: Number(u.baseCost) || 15
            }));
        }

        cookiesPerSecond = upgradesData.reduce((sum, u) => sum + (u.owned * u.cps), 0);
        return true;
    } catch (e) {
        console.error("Fehler beim Laden:", e);
        return false;
    }
}

function resetGame() {
    if (!confirm("Wirklich ALLES löschen?\nCookies, Upgrades, Bots, Erfolge – alles weg!")) {
        return;
    }

    // 1. Speicher komplett entfernen
    localStorage.removeItem(SAVE_KEY);

    // 2. Alle Variablen zurücksetzen (Sicherheitsnetz)
    cookies = 0;
    cookiesPerSecond = 0;
    clickValue = 1;
    achievements = [];
    lastMilestoneBots = 0;
    lastMilestoneSuffix = 0;
    upgradesData = [...initialUpgrades];
    aiBotIndex = 0;

    // 3. UI sofort aktualisieren
    renderUpgrades();
    updateDisplays();
    achievementsDiv.innerHTML = '<h2>Erfolge</h2>';

    // 4. Seite neu laden – das ist der sicherste Weg
    window.location.reload();
}

// ────────────────────────────────────────────────
// PREIS BERECHNEN
// ────────────────────────────────────────────────
function getUpgradeCost(upgrade) {
    return Math.ceil(upgrade.baseCost * Math.pow(1.15, upgrade.owned));
}

function getAIGenerateCost() {
    return Math.ceil(1000000 * Math.pow(1.85, aiBotIndex));
}

// ────────────────────────────────────────────────
// RENDER & UPDATE
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
    saveGame();
}

function updateDisplays() {
    cookieDisplay.textContent = abbreviate(cookies) + " cookies";
    cpsDisplay.textContent = formatCps(cookiesPerSecond) + " cookies pro Sekunde";

    const aiCost = getAIGenerateCost();
    aiGenerateBtn.textContent = `AI: Neuen Flavor Bot generieren! (${abbreviate(aiCost)} 🍪)`;
    aiGenerateBtn.className = cookies >= aiCost ? '' : 'locked';
}

// ────────────────────────────────────────────────
// EVENTS
// ────────────────────────────────────────────────
bigCookie.onclick = () => {
    cookies += clickValue;
    updateDisplays();
    renderUpgrades();
    checkMilestoneAchievements();
    if (Math.random() < 0.08) saveGame();
};

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
    saveGame();
};

resetBtn.onclick = resetGame;

setInterval(() => {
    cookies += cookiesPerSecond;
    updateDisplays();
    renderUpgrades();
    checkMilestoneAchievements();
    saveGame();
}, 1000);

// ────────────────────────────────────────────────
// GOLDEN COOKIE
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
    saveGame();
};

setInterval(spawnGoldenCookie, 40000 + Math.random()*60000);

// ────────────────────────────────────────────────
// ERFOLGE
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

    const botMilestones = [5,10,20,50,100,250,500,1000,2500,5000,10000];
    for (let goal of botMilestones) {
        if (aiBotIndex >= goal && lastMilestoneBots < goal) {
            addAchievement(`${goal} AI Flavor Bots freigeschaltet – Legendenstatus! 🔥🤖`);
            lastMilestoneBots = goal;
            break;
        }
    }

    const currentTier = getTier(cookies);
    if (currentTier > lastMilestoneSuffix) {
        const newSuffix = suffixForTier(currentTier);
        addAchievement(`Neue Liga: ${newSuffix} Cookies! 🍪∞`);
        lastMilestoneSuffix = currentTier;
    }
}

// ────────────────────────────────────────────────
// START
// ────────────────────────────────────────────────
loadGame();
renderUpgrades();
updateDisplays();
checkMilestoneAchievements();

// Beim Verlassen des Tabs speichern
window.addEventListener('beforeunload', saveGame);
