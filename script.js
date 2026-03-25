const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQvuIgcVvxltqjqcALb8tpaG-pmhY7VmV9G7AB0STX4964cPnLbG9Vfirr5N2fVoEEAkjCepvqxFtvg/pub?output=csv';
let clothingData = [], userInventory = [];

// --- HỆ SỐ ĐIỂM CHUẨN (NIKKI INFO) ---
const baseTable = { 'sss+': 6660, 'sss': 6000, 'sss-': 5520, 'ss+': 5280, 'ss': 4800, 'ss-': 4416, 's++': 4080, 's+': 3760, 's': 3600, 's-': 3360, 'a+': 2640, 'a': 2400, 'a-': 2200, 'b+': 1980, 'b': 1800, 'b-': 1660, 'c+': 1320, 'c': 1200, 'c-': 1104 };
const typeMods = { 'dress': 1, 'top': 0.5, 'bottom': 0.5, 'hair': 0.25, 'shoes': 0.25, 'coat': 0.25, 'makeup': 0.25, 'accessory': 0.1 };
const rarityMods = { 6: 1.25, 5: 1, 4: 0.8, 3: 0.6, 2: 0.45, 1: 0.3 };
const qualityMods = { 'đồ cực phẩm (top)': 1.25, 'đồ cao cấp': 1.1, 'đồ thông thường': 1 };

const arenaData = {
    "tiecvenbien": { simple: 0.67, sexy: 1.33, lively: 1.33, cool: 1.33, cute: 1.33 },
    "vanphong": { simple: 1.33, elegance: 1.33, mature: 1.33, sexy: 1, cool: 0.67 },
    "noel": { simple: 1.33, pure: 1.33, warm: 1.33, cute: 1, lively: 0.67 },
    "vandung": { simple: 1, lively: 1.33, sexy: 1.33, warm: 1.33, mature: 0.67 },
    "xuan": { simple: 1.33, lively: 1.33, cute: 1.33, pure: 1, cool: 0.67 },
    "he": { simple: 1.33, pure: 1.33, cool: 1.33, cute: 1, lively: 0.67 },
    "thethao": { simple: 1.33, lively: 1.33, cute: 1.33, pure: 1, cool: 0.67 },
    "thamtu": { simple: 1.33, elegance: 1.33, mature: 1.33, sexy: 1, warm: 0.67 },
    "rock": { simple: 1, lively: 1.33, sexy: 1.33, gorgeous: 1.33, cool: 0.67 },
    "thanhxuan": { simple: 1.33, pure: 1.33, cute: 1.33, lively: 1, cool: 0.67 },
    "tiectra": { gorgeous: 1.33, pure: 1.33, cute: 1.33, simple: 1, cool: 0.67 },
    "datiec": { gorgeous: 1.33, elegance: 1.33, sexy: 1.33, mature: 1, warm: 0.67 },
    "nuvuong": { gorgeous: 1.33, elegance: 1.33, mature: 1.33, sexy: 1, cool: 0.67 },
    "ngoisao": { gorgeous: 1.33, lively: 1.33, sexy: 1.33, simple: 1, cool: 0.67 },
    "tuyet": { gorgeous: 1.33, elegance: 1.33, pure: 1.33, mature: 1, warm: 0.67 },
    "kythao": { gorgeous: 1.33, elegance: 1.33, pure: 1.33, cute: 1, cool: 0.67 },
    "phale": { gorgeous: 1.33, elegance: 1.33, cute: 1.33, pure: 1, cool: 0.67 }
};

// --- KHỞI TẠO VÀ LOAD DỮ LIỆU ---
async function init() {
    try {
        const res = await fetch(SHEET_URL);
        const data = await res.text();
        const rows = data.split(/\r?\n/).slice(1);
        userInventory = JSON.parse(localStorage.getItem('inventory')) || [];
        
        clothingData = rows.map(row => {
            if (!row.trim()) return null;
            const c = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (c.length < 28) return null;

            const id = c[0].trim();
            if (c[3]?.trim().toUpperCase() === 'TRUE' && !userInventory.includes(id)) {
                userInventory.push(id);
            }

            return {
                id,
                image: c[1].trim(),
                name: c[27]?.trim().replace(/"/g,"") || c[2]?.trim().replace(/"/g,""), // Cột AB ưu tiên
                type: c[4].trim().toLowerCase(),
                star: c[5].trim(),
                quality: c[19]?.trim() || 'đồ thông thường',
                tags: [c[16]?.trim(), c[17]?.trim()].filter(t => t && t !== ""),
                stats: { gorgeous: c[6], simple: c[7], elegance: c[8], lively: c[9], mature: c[10], cute: c[11], sexy: c[12], pure: c[13], warm: c[14], cool: c[15] }
            };
        }).filter(i => i);
        renderUI();
    } catch (e) { console.error("Lỗi khởi tạo:", e); }
}

// --- LOGIC TÍNH TOÁN PRO (ĐẦM VS ÁO+QUẦN & PHỤ KIỆN LẺ) ---
function calculateEverything() {
    const aid = document.getElementById('arena-select').value;
    const stag = document.getElementById('tag-select').value;
    const ARENA_SCALE = 1.315; 
    
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

    const types = [...new Set(clothingData.map(i => i.type))];
    let scoredByType = {};

    // 1. Tính điểm từng món và phân loại
    types.forEach(type => {
        scoredByType[type] = clothingData.filter(i => i.type === type).map(item => {
            let s = 0;
            let gMod = typeMods['accessory'];
            if (type === 'dress') gMod = typeMods['dress'];
            else if (type === 'top' || type === 'bottom') gMod = typeMods['top'];
            else if (['hair', 'shoes', 'coat', 'makeup'].includes(type)) gMod = typeMods[type];

            for (let k in w) {
                if (w[k] > 0) {
                    const rank = item.stats[k]?.toLowerCase().trim();
                    const base = baseTable[rank] || 0;
                    const rMod = rarityMods[item.star] || 1;
                    const qMod = qualityMods[item.quality.toLowerCase()] || 1;
                    s += (base * gMod * rMod * qMod) * w[k];
                }
            }
            s *= ARENA_SCALE;
            if (stag && item.tags.includes(stag)) s *= 2.15;
            return { ...item, finalScore: Math.round(s) };
        }).sort((a,b) => b.finalScore - a.finalScore);
    });

    // 2. Logic chọn Bộ Đồ Mạnh Nhất
    const getBestOwned = (t) => scoredByType[t]?.find(i => userInventory.includes(i.id));
    let bestSet = [], totalScore = 0;

    const bDress = getBestOwned('dress'), bTop = getBestOwned('top'), bBottom = getBestOwned('bottom');
    const sDress = bDress ? bDress.finalScore : 0;
    const sTB = (bTop ? bTop.finalScore : 0) + (bBottom ? bBottom.finalScore : 0);

    // Quyết định Đầm hay Áo+Quần
    if (sDress >= sTB && bDress) { bestSet.push(bDress); totalScore += sDress; }
    else { 
        if (bTop) { bestSet.push(bTop); totalScore += bTop.finalScore; } 
        if (bBottom) { bestSet.push(bBottom); totalScore += bBottom.finalScore; } 
    }

    // Lấy TẤT CẢ các loại phụ kiện lẻ và các món khác
    types.filter(t => !['dress', 'top', 'bottom'].includes(t)).forEach(type => {
        const item = getBestOwned(type);
        if (item) { bestSet.push(item); totalScore += item.finalScore; }
    });

    // 3. Hiển thị Best Set (Giao diện chuẩn Nikki Info)
    document.getElementById('total-score-val').innerText = totalScore.toLocaleString();
    document.getElementById('best-set-list').innerHTML = bestSet.map(i => `
        <li class="best-item-card">
            <img src="${i.image}" class="img-square">
            <div class="item-card-content">
                <div class="item-id-info">${i.type} no. ${i.id}</div>
                <div class="item-name-text" style="color:var(--pink)">${i.name}</div>
                <div class="score-tag">${i.finalScore.toLocaleString()}</div>
            </div>
        </li>`).join('');

    // 4. Hiển thị Rankings Top 20 (Giao diện 2 cột)
    let guideHtml = "";
    types.sort().forEach(type => {
        const top20 = scoredByType[type].slice(0, 20);
        guideHtml += `
            <div class="guide-cat">
                <div class="guide-title" onclick="this.nextElementSibling.classList.toggle('active')">${type.toUpperCase()} <span>▼</span></div>
                <ul class="guide-list active">
                    ${top20.map((i, idx) => `
                        <li class="${userInventory.includes(i.id) ? 'is-owned' : 'not-owned'}">
                            <img src="${i.image}" class="img-square">
                            <div class="item-card-content">
                                <div class="item-id-info">${i.type} no. ${i.id}</div>
                                <div class="item-name-text">${i.name}</div>
                                <div class="item-links">Copy permalink | name</div>
                                <div class="guide-meta">
                                    <small>★${i.star} ${userInventory.includes(i.id) ? '✅' : ''}</small>
                                    <b class="score-tag">${i.finalScore.toLocaleString()}</b>
                                </div>
                            </div>
                        </li>`).join('')}
                </ul>
            </div>`;
    });
    document.getElementById('advanced-guide').innerHTML = guideHtml;
    document.getElementById('result-container').style.display = 'block';
}

// --- CÁC HÀM UI ---
function renderUI() {
    const cats = [...new Set(clothingData.map(i => i.type))].sort();
    document.getElementById('category-tabs').innerHTML = cats.map(cat => `<button class="tab-btn" onclick="showCat('${cat}')">${cat.toUpperCase()}</button>`).join('');
    const allTags = [...new Set(clothingData.flatMap(i => i.tags))].sort();
    document.getElementById('tag-select').innerHTML = '<option value="">-- Chọn Tag --</option>' + allTags.map(t => `<option value="${t}">${t}</option>`).join('');
    showCat(cats[0]);
}
function showCat(type) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.innerText.toLowerCase() === type.toLowerCase()));
    const items = clothingData.filter(i => i.type === type);
    document.getElementById('item-lists').innerHTML = items.map(i => `
        <label class="item-checkbox ${userInventory.includes(i.id)?'is-checked':''}">
            <input type="checkbox" value="${i.id}" ${userInventory.includes(i.id)?'checked':''} onchange="toggleItem('${i.id}', this.checked, this)">
            <img src="${i.image}" class="img-square">
            <div class="item-card-content">
                <div class="item-id-info">no. ${i.id}</div>
                <div class="item-name-text">${i.name}</div>
            </div>
        </label>`).join('');
}
function toggleItem(id, own, el) { 
    if(own) { if(!userInventory.includes(id)) userInventory.push(id); el.parentElement.classList.add('is-checked'); } 
    else { userInventory = userInventory.filter(i => i !== id); el.parentElement.classList.remove('is-checked'); } 
}
function saveInventory() { localStorage.setItem('inventory', JSON.stringify(userInventory)); alert("Đã lưu!"); }
function applyArenaWeights() {
    const aid = document.getElementById('arena-select').value;
    const attrs = ['simple','gorgeous','pure','sexy','elegance','lively','warm','cool','cute','mature'];
    attrs.forEach(a => document.getElementById(`w-${a}`).value = 0);
    if (aid && arenaData[aid]) { for (let k in arenaData[aid]) document.getElementById(`w-${k}`).value = arenaData[aid][k]; calculateEverything(); }
}
init();
