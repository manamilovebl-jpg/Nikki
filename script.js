const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQvuIgcVvxltqjqcALb8tpaG-pmhY7VmV9G7AB0STX4964cPnLbG9Vfirr5N2fVoEEAkjCepvqxFtvg/pub?output=csv';

let clothingData = [];
let userInventory = [];

// BẢNG ĐIỂM CHUYÊN NGHIỆP (Dựa trên ảnh tra cứu của bạn)
const baseScores = {
    'sss': { 'dress': 5760, 'top': 2880, 'bottom': 2880, 'hair': 1440, 'shoes': 1440, 'coat': 1440, 'accessory': 576, 'makeup': 576 },
    'ss':  { 'dress': 4800, 'top': 2400, 'bottom': 2400, 'hair': 1200, 'shoes': 1200, 'coat': 1200, 'accessory': 480, 'makeup': 480 },
    's':   { 'dress': 4000, 'top': 2000, 'bottom': 2000, 'hair': 1000, 'shoes': 1000, 'coat': 1000, 'accessory': 400, 'makeup': 400 },
    'a':   { 'dress': 3000, 'top': 1500, 'bottom': 1500, 'hair': 750,  'shoes': 750,  'coat': 750,  'accessory': 300, 'makeup': 300 },
    'b':   { 'dress': 2000, 'top': 1000, 'bottom': 1000, 'hair': 500,  'shoes': 500,  'coat': 500,  'accessory': 200, 'makeup': 200 },
    'c':   { 'dress': 1000, 'top': 500,  'bottom': 500,  'hair': 250,  'shoes': 250,  'coat': 250,  'accessory': 100, 'makeup': 100 }
};

const arenaData = {
    "xuan": { simple: 1.33, lively: 1.33, cute: 1.33, pure: 1.0, cool: 1.0 },
    "he": { simple: 1.33, pure: 1.33, cool: 1.33, cute: 1.0, lively: 1.0 },
    "noel": { simple: 1.33, pure: 1.33, warm: 1.33, cute: 1.0, elegance: 1.0 },
    "vanphong": { simple: 1.33, elegance: 1.33, mature: 1.33, sexy: 1.0, cool: 1.0 },
    "thethao": { simple: 1.33, lively: 1.33, cute: 1.33, pure: 1.0, cool: 1.0 },
    "thamtu": { simple: 1.33, elegance: 1.33, mature: 1.33, sexy: 1.0, warm: 1.0 },
    "rock": { simple: 1.33, lively: 1.33, sexy: 1.33, gorgeous: 1.0, cool: 1.0 },
    "thanhxuan": { simple: 1.33, pure: 1.33, cute: 1.33, lively: 1.0, cool: 1.0 },
    "vandung": { simple: 1.33, lively: 1.33, sexy: 1.33, mature: 1.0, warm: 1.0 },
    "tiectra": { gorgeous: 1.33, pure: 1.33, cute: 1.33, simple: 1.0, cool: 1.0 },
    "datiec": { gorgeous: 1.33, elegance: 1.33, sexy: 1.33, mature: 1.0, warm: 1.0 },
    "nuvuong": { gorgeous: 1.33, elegance: 1.33, mature: 1.33, sexy: 1.0, cool: 1.0 },
    "ngoisao": { gorgeous: 1.33, lively: 1.33, sexy: 1.33, simple: 1.0, cool: 1.0 },
    "tuyet": { gorgeous: 1.33, elegance: 1.33, pure: 1.33, mature: 1.0, warm: 1.0 },
    "kythao": { gorgeous: 1.33, elegance: 1.33, pure: 1.33, cute: 1.0, cool: 1.0 },
    "khoahoa": { gorgeous: 1.33, elegance: 1.33, sexy: 1.33, mature: 1.0, cool: 1.0 },
    "phale": { gorgeous: 1.33, elegance: 1.33, cute: 1.33, pure: 1.0, cool: 1.0 }
};

// Hàm lấy điểm chuẩn dựa trên Rank và Loại đồ
function getNikkiScore(rank, type) {
    if (!rank) return 0;
    const r = rank.trim().toLowerCase();
    const t = type.trim().toLowerCase();
    
    let category = 'accessory';
    if (t === 'dress') category = 'dress';
    else if (t === 'top' || t === 'bottom') category = 'top';
    else if (['hair', 'shoes', 'coat'].includes(t)) category = 'hair';
    else if (t === 'makeup') category = 'makeup';

    return (baseScores[r] && baseScores[r][category]) ? baseScores[r][category] : 0;
}

async function init() {
    try {
        const response = await fetch(SHEET_URL);
        const data = await response.text();
        const rows = data.split('\n').slice(1);
        userInventory = []; 

        clothingData = rows.map(row => {
            const c = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (c.length < 5) return null;
            const itemId = c[0]?.trim();
            const type = c[4]?.trim().toLowerCase();
            
            if (c[3]?.trim().toUpperCase() === 'TRUE') userInventory.push(itemId);

            return {
                id: itemId,
                image: c[1]?.trim() || 'https://via.placeholder.com/45',
                name: c[2]?.trim().replace(/"/g, ""),
                type: type,
                tags: [c[16]?.trim(), c[17]?.trim()].filter(t => t),
                stats: {
                    gorgeous: getNikkiScore(c[6], type),
                    simple: getNikkiScore(c[7], type),
                    elegance: getNikkiScore(c[8], type),
                    lively: getNikkiScore(c[9], type),
                    mature: getNikkiScore(c[10], type),
                    cute: getNikkiScore(c[11], type),
                    sexy: getNikkiScore(c[12], type),
                    pure: getNikkiScore(c[13], type),
                    warm: getNikkiScore(c[14], type),
                    cool: getNikkiScore(c[15], type)
                }
            };
        }).filter(i => i && i.id);

        renderTabs();
        showCategory(clothingData[0]?.type);
    } catch (e) { console.error("Lỗi:", e); }
}

function renderTabs() {
    const cats = [...new Set(clothingData.map(i => i.type))];
    document.getElementById('category-tabs').innerHTML = cats.map(cat => `<button class="tab-btn" onclick="showCategory('${cat}')">${cat.toUpperCase()}</button>`).join('');
    const allTags = [];
    clothingData.forEach(item => item.tags.forEach(t => allTags.push(t)));
    document.getElementById('tag-select').innerHTML = '<option value="">-- Không có Tag --</option>' + [...new Set(allTags)].sort().map(t => `<option value="${t}">${t}</option>`).join('');
}

function showCategory(type) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.innerText.toLowerCase() === type.toLowerCase()));
    const items = clothingData.filter(i => i.type === type);
    document.getElementById('item-lists').innerHTML = items.map(item => `
        <label class="item-checkbox">
            <input type="checkbox" value="${item.id}" ${userInventory.includes(item.id) ? 'checked' : ''} onchange="updateItem('${item.id}', this.checked)">
            <img src="${item.image}" class="item-thumb" onerror="this.src='https://via.placeholder.com/45'">
            <div class="item-info"><b>${item.name}</b><br><small>${item.id}</small></div>
        </label>`).join('');
}

function applyArenaWeights() {
    const aid = document.getElementById('arena-select').value;
    const attrs = ['simple', 'gorgeous', 'pure', 'sexy', 'elegance', 'lively', 'warm', 'cool', 'cute', 'mature'];
    attrs.forEach(a => document.getElementById(`w-${a}`).value = 0.1);
    if (aid && arenaData[aid]) {
        for (let k in arenaData[aid]) document.getElementById(`w-${k}`).value = arenaData[aid][k];
        suggestBestOutfit();
    }
}

function suggestBestOutfit() {
    const stag = document.getElementById('tag-select').value;
    const w = {
        gorgeous: parseFloat(document.getElementById('w-gorgeous').value) || 0,
        simple: parseFloat(document.getElementById('w-simple').value) || 0,
        pure: parseFloat(document.getElementById('w-pure').value) || 0,
        sexy: parseFloat(document.getElementById('w-sexy').value) || 0,
        elegance: parseFloat(document.getElementById('w-elegance').value) || 0,
        lively: parseFloat(document.getElementById('w-lively').value) || 0,
        warm: parseFloat(document.getElementById('w-warm').value) || 0,
        cool: parseFloat(document.getElementById('w-cool').value) || 0,
        cute: parseFloat(document.getElementById('w-cute').value) || 0,
        mature: parseFloat(document.getElementById('w-mature').value) || 0
    };

    const myItems = clothingData.filter(i => userInventory.includes(i.id));
    const types = [...new Set(clothingData.map(i => i.type))];
    let total = 0;
    let html = "";

    types.forEach(t => {
        let best = null, max = -1;
        myItems.filter(i => i.type === t).forEach(item => {
            let s = 0;
            for (let k in w) s += (item.stats[k] || 0) * w[k];
            if (stag && item.tags.includes(stag)) s *= 2; // Thưởng Tag
            if (s > max) { max = s; best = item; }
        });

        if (best) {
            total += max;
            html += `<li>
                <img src="${best.image}" class="item-thumb">
                <div>
                    <b>${t.toUpperCase()}:</b> ${best.name} ${stag && best.tags.includes(stag) ? '<span style="color:red;">[Tag]</span>' : ''}
                    <br><small>Điểm: ${Math.round(max).toLocaleString()}</small>
                </div>
            </li>`;
        }
    });

    document.getElementById('total-score-val').innerText = Math.round(total).toLocaleString();
    document.getElementById('suggestion-list').innerHTML = html;
    document.getElementById('result-box').style.display = total > 0 ? 'block' : 'none';
}

function updateItem(id, c) {
    if(c) { if(!userInventory.includes(id)) userInventory.push(id); }
    else userInventory = userInventory.filter(i => i !== id);
}

function saveInventory() {
    localStorage.setItem('my_nikki_items', JSON.stringify(userInventory));
    alert("Đã lưu kho đồ tạm thời!");
}

init();
