const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQvuIgcVvxltqjqcALb8tpaG-pmhY7VmV9G7AB0STX4964cPnLbG9Vfirr5N2fVoEEAkjCepvqxFtvg/pub?output=csv';
let clothingData = [], userInventory = [];

// BẢNG ĐIỂM CHI TIẾT (Đã tinh chỉnh để sát với chỉ số ẩn)
const baseScores = {
    'sss': { 'dress': 5820, 'top': 2910, 'bottom': 2910, 'hair': 1450, 'shoes': 1450, 'coat': 1450, 'accessory': 580, 'makeup': 580 },
    'ss':  { 'dress': 4850, 'top': 2425, 'bottom': 2425, 'hair': 1210, 'shoes': 1210, 'coat': 1210, 'accessory': 485, 'makeup': 485 },
    's':   { 'dress': 4050, 'top': 2025, 'bottom': 2025, 'hair': 1010, 'shoes': 1010, 'coat': 1010, 'accessory': 405, 'makeup': 405 },
    'a':   { 'dress': 3050, 'top': 1525, 'bottom': 1525, 'hair': 760,  'shoes': 760,  'coat': 760,  'accessory': 305, 'makeup': 305 },
    'b':   { 'dress': 2050, 'top': 1025, 'bottom': 1025, 'hair': 510,  'shoes': 510,  'coat': 510,  'accessory': 205, 'makeup': 205 },
    'c':   { 'dress': 1050, 'top': 525,  'bottom': 525,  'hair': 260,  'shoes': 260,  'coat': 260,  'accessory': 105, 'makeup': 105 }
};

const arenaData = {
    "tiecvenbien": { simple: 1.33, pure: 1.33, cool: 1.33, cute: 1.0, lively: 1.0, theme: "theme-he" },
    "vanphong": { simple: 1.33, elegance: 1.33, mature: 1.33, sexy: 1.0, cool: 1.0, theme: "theme-vanphong" },
    "noel": { simple: 1.33, pure: 1.33, warm: 1.33, cute: 1.0, elegance: 1.0, theme: "theme-noel" },
    "vandung": { simple: 1.33, lively: 1.33, sexy: 1.33, mature: 1.0, warm: 1.0 },
    "xuan": { simple: 1.33, lively: 1.33, cute: 1.33, pure: 1.0, cool: 1.0, theme: "theme-xuan" },
    "he": { simple: 1.33, pure: 1.33, cool: 1.33, cute: 1.0, lively: 1.0, theme: "theme-he" },
    "thethao": { simple: 1.33, lively: 1.33, cute: 1.33, pure: 1.0, cool: 1.0 },
    "thamtu": { simple: 1.33, elegance: 1.33, mature: 1.33, sexy: 1.0, warm: 1.0, theme: "theme-vanphong" },
    "rock": { simple: 1.33, lively: 1.33, sexy: 1.33, gorgeous: 1.0, cool: 1.0 },
    "thanhxuan": { simple: 1.33, pure: 1.33, cute: 1.33, lively: 1.0, cool: 1.0 },
    "tiectra": { gorgeous: 1.33, pure: 1.33, cute: 1.33, simple: 1.0, cool: 1.0 },
    "datiec": { gorgeous: 1.33, elegance: 1.33, sexy: 1.33, mature: 1.0, warm: 1.0, theme: "theme-datiec" },
    "nuvuong": { gorgeous: 1.33, elegance: 1.33, mature: 1.33, sexy: 1.0, cool: 1.0, theme: "theme-datiec" },
    "ngoisao": { gorgeous: 1.33, lively: 1.33, sexy: 1.33, simple: 1.0, cool: 1.0 },
    "tuyet": { gorgeous: 1.33, elegance: 1.33, pure: 1.33, mature: 1.0, warm: 1.0 },
    "kythao": { gorgeous: 1.33, elegance: 1.33, pure: 1.33, cute: 1.0, cool: 1.0 },
    "phale": { gorgeous: 1.33, elegance: 1.33, cute: 1.33, pure: 1.0, cool: 1.0 }
};

function getNikkiScore(rank, type, star) {
    if (!rank) return 0;
    const r = rank.trim().toLowerCase();
    const t = type.trim().toLowerCase();
    
    let cat = 'accessory';
    let penalty = 1.0; 

    if (t === 'dress') cat = 'dress';
    else if (t === 'top' || t === 'bottom') cat = 'top';
    else if (['hair', 'shoes', 'coat'].includes(t)) cat = 'hair';
    else if (t === 'makeup') cat = 'makeup';
    else {
        cat = 'accessory';
        penalty = 0.4; // PHẠT 60% ĐIỂM CHO PHỤ KIỆN (Giống Nikki Info)
    }

    const base = (baseScores[r] && baseScores[r][cat]) ? baseScores[r][cat] : 0;
    const starBonus = (parseInt(star) || 0) * 12; // Tăng nhẹ bonus sao

    return base > 0 ? ((base + starBonus) * penalty) : 0;
}

// ... (Các hàm init, renderUI, showCat giữ nguyên như bản trước) ...

async function init() {
    try {
        const response = await fetch(SHEET_URL);
        const data = await response.text();
        const rows = data.split('\n').slice(1);
        userInventory = []; 
        clothingData = rows.map(row => {
            const c = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (c.length < 5) return null;
            const id = c[0]?.trim();
            const type = c[4]?.trim().toLowerCase();
            const stars = c[5]?.trim();
            if (c[3]?.trim().toUpperCase() === 'TRUE') userInventory.push(id);
            return {
                id, image: c[1]?.trim(), name: c[2]?.trim().replace(/"/g, ""), type, star: stars,
                tags: [c[16]?.trim(), c[17]?.trim()].filter(t => t),
                stats: {
                    gorgeous: c[6], simple: c[7], elegance: c[8], lively: c[9], mature: c[10], cute: c[11], sexy: c[12], pure: c[13], warm: c[14], cool: c[15]
                }
            };
        }).filter(i => i);
        renderUI();
    } catch (e) { console.error(e); }
}

function renderUI() {
    const cats = [...new Set(clothingData.map(i => i.type))];
    document.getElementById('category-tabs').innerHTML = cats.map(cat => `<button class="tab-btn" onclick="showCat('${cat}')">${cat.toUpperCase()}</button>`).join('');
    const allTags = [...new Set(clothingData.flatMap(i => i.tags))].sort();
    document.getElementById('tag-select').innerHTML = '<option value="">-- Không Tag --</option>' + allTags.map(t => `<option value="${t}">${t}</option>`).join('');
    showCat(cats[0]);
}

function showCat(type) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.innerText.toLowerCase() === type.toLowerCase()));
    const items = clothingData.filter(i => i.type === type);
    document.getElementById('item-lists').innerHTML = items.map(i => `
        <label class="item-checkbox">
            <span class="item-star-tag">★${i.star}</span>
            <input type="checkbox" value="${i.id}" ${userInventory.includes(i.id)?'checked':''} onchange="toggleItem('${i.id}', this.checked)">
            <img src="${i.image}" class="item-thumb" onerror="this.src='https://via.placeholder.com/45'">
            <div class="item-info"><b>${i.name}</b><br><small>${i.id}</small></div>
        </label>`).join('');
}

function calculateEverything() {
    const stag = document.getElementById('tag-select').value;
    const w = {
        gorgeous: parseFloat(document.getElementById('w-gorgeous').value)||0.1, simple: parseFloat(document.getElementById('w-simple').value)||0.1,
        pure: parseFloat(document.getElementById('w-pure').value)||0.1, sexy: parseFloat(document.getElementById('w-sexy').value)||0.1,
        elegance: parseFloat(document.getElementById('w-elegance').value)||0.1, lively: parseFloat(document.getElementById('w-lively').value)||0.1,
        warm: parseFloat(document.getElementById('w-warm').value)||0.1, cool: parseFloat(document.getElementById('w-cool').value)||0.1,
        cute: parseFloat(document.getElementById('w-cute').value)||0.1, mature: parseFloat(document.getElementById('w-mature').value)||0.1
    };

    const types = [...new Set(clothingData.map(i => i.type))];
    let totalScore = 0, bestHtml = "", guideHtml = "";

    types.forEach(type => {
        let scoredItems = clothingData.filter(i => i.type === type).map(item => {
            let s = 0;
            for (let k in w) { s += getNikkiScore(item.stats[k], type, item.star) * w[k]; }
            if (stag && item.tags.includes(stag)) s *= 2;
            return { ...item, finalScore: Math.round(s) };
        }).sort((a,b) => b.finalScore - a.finalScore);

        const bestOwned = scoredItems.find(i => userInventory.includes(i.id));
        if (bestOwned) {
            totalScore += bestOwned.finalScore;
            bestHtml += `<li><img src="${bestOwned.image}" class="item-thumb"><div><b>${type.toUpperCase()}:</b> ${bestOwned.name}<br><small>Điểm: ${bestOwned.finalScore.toLocaleString()}</small></div></li>`;
        }

        const top20 = scoredItems.slice(0, 20);
        guideHtml += `
            <div class="guide-cat">
                <div class="guide-title" onclick="this.nextElementSibling.classList.toggle('active')">${type.toUpperCase()} (Top 20 Rankings)</div>
                <ul class="guide-list">
                    ${top20.map((i,idx) => `
                        <li class="${userInventory.includes(i.id)?'is-owned':'not-owned'}">
                            <span>#${idx+1} ${i.name} ★${i.star} ${userInventory.includes(i.id)?'✅':''}</span>
                            <span class="score-tag">${i.finalScore.toLocaleString()}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>`;
    });

    document.getElementById('total-score-val').innerText = totalScore.toLocaleString();
    document.getElementById('best-set-list').innerHTML = bestHtml;
    document.getElementById('advanced-guide').innerHTML = guideHtml;
    document.getElementById('result-container').style.display = 'block';
}

function toggleItem(id, own) { if(own) { if(!userInventory.includes(id)) userInventory.push(id); } else userInventory = userInventory.filter(i => i!==id); }
function saveInventory() { localStorage.setItem('inventory', JSON.stringify(userInventory)); alert("Đã lưu kho đồ!"); }
function applyArenaWeights() {
    const aid = document.getElementById('arena-select').value;
    const body = document.getElementById('main-body');
    body.className = '';
    const attrs = ['simple','gorgeous','pure','sexy','elegance','lively','warm','cool','cute','mature'];
    attrs.forEach(a => document.getElementById(`w-${a}`).value = 0.1);
    if (aid && arenaData[aid]) {
        if(arenaData[aid].theme) body.classList.add(arenaData[aid].theme);
        for (let k in arenaData[aid]) { if(k !== 'theme') document.getElementById(`w-${k}`).value = arenaData[aid][k]; }
        calculateEverything();
    }
}
init();
