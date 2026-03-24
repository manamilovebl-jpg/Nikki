const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQvuIgcVvxltqjqcALb8tpaG-pmhY7VmV9G7AB0STX4964cPnLbG9Vfirr5N2fVoEEAkjCepvqxFtvg/pub?output=csv';
let clothingData = [], userInventory = [];

const baseScores = {
    'sss': { 'dress': 5760, 'top': 2880, 'bottom': 2880, 'hair': 1440, 'shoes': 1440, 'coat': 1440, 'accessory': 576, 'makeup': 576 },
    'ss':  { 'dress': 4800, 'top': 2400, 'bottom': 2400, 'hair': 1200, 'shoes': 1200, 'coat': 1200, 'accessory': 480, 'makeup': 480 },
    's':   { 'dress': 4000, 'top': 2000, 'bottom': 2000, 'hair': 1000, 'shoes': 1000, 'coat': 1000, 'accessory': 400, 'makeup': 400 },
    'a':   { 'dress': 3000, 'top': 1500, 'bottom': 1500, 'hair': 750,  'shoes': 750,  'coat': 750,  'accessory': 300, 'makeup': 300 },
    'b':   { 'dress': 2000, 'top': 1000, 'bottom': 1000, 'hair': 500,  'shoes': 500,  'coat': 500,  'accessory': 200, 'makeup': 200 },
    'c':   { 'dress': 1000, 'top': 500,  'bottom': 500,  'hair': 250,  'shoes': 250,  'coat': 250,  'accessory': 100, 'makeup': 100 }
};

function getScore(rank, type, star) {
    if (!rank) return 0;
    const r = rank.trim().toLowerCase();
    const t = type.trim().toLowerCase();
    let cat = (['hair','shoes','coat'].includes(t)) ? 'hair' : (t === 'makeup' ? 'makeup' : (t === 'dress' ? 'dress' : (t === 'top' || t === 'bottom' ? 'top' : 'accessory')));
    const base = baseScores[r] ? (baseScores[r][cat] || baseScores[r]['accessory']) : 0;
    return base > 0 ? (base + (parseInt(star)||0)*10) : 0;
}

async function init() {
    const res = await fetch(SHEET_URL);
    const data = await res.text();
    const rows = data.split('\n').slice(1);
    clothingData = rows.map(row => {
        const c = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        if (c.length < 5) return null;
        const id = c[0].trim();
        if (c[3]?.trim().toUpperCase() === 'TRUE') userInventory.push(id);
        return {
            id, image: c[1].trim(), name: c[2].trim().replace(/"/g,""), type: c[4].trim().toLowerCase(), star: c[5].trim(),
            tags: [c[16]?.trim(), c[17]?.trim()].filter(t => t),
            stats: { gorgeous: c[6], simple: c[7], elegance: c[8], lively: c[9], mature: c[10], cute: c[11], sexy: c[12], pure: c[13], warm: c[14], cool: c[15] }
        };
    }).filter(i => i);
    renderUI();
}

function renderUI() {
    const cats = [...new Set(clothingData.map(i => i.type))];
    document.getElementById('category-tabs').innerHTML = cats.map(cat => `<button class="tab-btn" onclick="showCat('${cat}')">${cat.toUpperCase()}</button>`).join('');
    const allTags = [...new Set(clothingData.flatMap(i => i.tags))].sort();
    document.getElementById('tag-select').innerHTML = '<option value="">-- Không Tag --</option>' + allTags.map(t => `<option value="${t}">${t}</option>`).join('');
    showCat(cats[0]);
}

function showCat(type) {
    const items = clothingData.filter(i => i.type === type);
    document.getElementById('item-lists').innerHTML = items.map(i => `
        <label class="item-checkbox">
            <input type="checkbox" value="${i.id}" ${userInventory.includes(i.id)?'checked':''} onchange="toggleItem('${i.id}', this.checked)">
            <img src="${i.image}" class="item-thumb">
            <div><b>${i.name}</b><br><small>★${i.star}</small></div>
        </label>`).join('');
}

function calculateEverything() {
    const stag = document.getElementById('tag-select').value;
    const w = {
        gorgeous: parseFloat(document.getElementById('w-gorgeous').value)||0, simple: parseFloat(document.getElementById('w-simple').value)||0,
        pure: parseFloat(document.getElementById('w-pure').value)||0, sexy: parseFloat(document.getElementById('w-sexy').value)||0,
        elegance: parseFloat(document.getElementById('w-elegance').value)||0, lively: parseFloat(document.getElementById('w-lively').value)||0,
        warm: parseFloat(document.getElementById('w-warm').value)||0, cool: parseFloat(document.getElementById('w-cool').value)||0,
        cute: parseFloat(document.getElementById('w-cute').value)||0, mature: parseFloat(document.getElementById('w-mature').value)||0
    };

    const types = [...new Set(clothingData.map(i => i.type))];
    let totalScore = 0, bestHtml = "", guideHtml = "";

    types.forEach(type => {
        // Tính điểm cho tất cả đồ trong game
        let scoredItems = clothingData.filter(i => i.type === type).map(item => {
            let s = 0;
            for (let k in w) { s += getScore(item.stats[k], type, item.star) * w[k]; }
            if (stag && item.tags.includes(stag)) s *= 2;
            return { ...item, finalScore: Math.round(s) };
        }).sort((a,b) => b.finalScore - a.finalScore);

        // 1. Tìm món tốt nhất BẠN ĐANG CÓ
        const bestOwned = scoredItems.find(i => userInventory.includes(i.id));
        if (bestOwned) {
            totalScore += bestOwned.finalScore;
            bestHtml += `<li><img src="${bestOwned.image}" class="item-thumb"><div><b>${type.toUpperCase()}:</b> ${bestOwned.name}<br><small>Điểm: ${bestOwned.finalScore}</small></div></li>`;
        }

        // 2. Tạo Top 20 toàn bộ (có đánh dấu cái nào đã có)
        const top20 = scoredItems.slice(0, 20);
        guideHtml += `
            <div class="guide-cat">
                <div class="guide-title" onclick="this.nextElementSibling.classList.toggle('active')">${type.toUpperCase()} (Hiện Top 20)</div>
                <ul class="guide-list">
                    ${top20.map((i,idx) => `
                        <li class="${userInventory.includes(i.id)?'is-owned':'not-owned'}">
                            <span>#${idx+1} ${i.name} ★${i.star} ${userInventory.includes(i.id)?'✅':''}</span>
                            <span class="score-tag">${i.finalScore}</span>
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

function toggleItem(id, own) { if(own) userInventory.push(id); else userInventory = userInventory.filter(i => i!==id); }
function saveInventory() { localStorage.setItem('inventory', JSON.stringify(userInventory)); alert("Đã lưu!"); }
function applyArenaWeights() {
    const aid = document.getElementById('arena-select').value;
    const arenaData = {
        "tiecvenbien": { simple: 1.33, pure: 1.33, cool: 1.33, cute: 1.0, lively: 1.0 },
        "vanphong": { simple: 1.33, elegance: 1.33, mature: 1.33, sexy: 1.0, cool: 1.0 },
        "noel": { simple: 1.33, pure: 1.33, warm: 1.33, cute: 1.0, elegance: 1.0 },
        "vandung": { simple: 1.33, lively: 1.33, sexy: 1.33, mature: 1.0, warm: 1.0 },
        "xuan": { simple: 1.33, lively: 1.33, cute: 1.33, pure: 1.0, cool: 1.0 },
        "he": { simple: 1.33, pure: 1.33, cool: 1.33, cute: 1.0, lively: 1.0 },
        "thethao": { simple: 1.33, lively: 1.33, cute: 1.33, pure: 1.0, cool: 1.0 },
        "thamtu": { simple: 1.33, elegance: 1.33, mature: 1.33, sexy: 1.0, warm: 1.0 },
        "rock": { simple: 1.33, lively: 1.33, sexy: 1.33, gorgeous: 1.0, cool: 1.0 },
        "thanhxuan": { simple: 1.33, pure: 1.33, cute: 1.33, lively: 1.0, cool: 1.0 },
        "tiectra": { gorgeous: 1.33, pure: 1.33, cute: 1.33, simple: 1.0, cool: 1.0 },
        "datiec": { gorgeous: 1.33, elegance: 1.33, sexy: 1.33, mature: 1.0, warm: 1.0 },
        "nuvuong": { gorgeous: 1.33, elegance: 1.33, mature: 1.33, sexy: 1.0, cool: 1.0 },
        "ngoisao": { gorgeous: 1.33, lively: 1.33, sexy: 1.33, simple: 1.0, cool: 1.0 },
        "tuyet": { gorgeous: 1.33, elegance: 1.33, pure: 1.33, mature: 1.0, warm: 1.0 },
        "kythao": { gorgeous: 1.33, elegance: 1.33, pure: 1.33, cute: 1.0, cool: 1.0 },
        "phale": { gorgeous: 1.33, elegance: 1.33, cute: 1.33, pure: 1.0, cool: 1.0 }
    };
    const attrs = ['simple','gorgeous','pure','sexy','elegance','lively','warm','cool','cute','mature'];
    attrs.forEach(a => document.getElementById(`w-${a}`).value = 0.1);
    if (aid && arenaData[aid]) {
        for (let k in arenaData[aid]) document.getElementById(`w-${k}`).value = arenaData[aid][k];
        calculateEverything();
    }
}
init();
