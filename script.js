const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQvuIgcVvxltqjqcALb8tpaG-pmhY7VmV9G7AB0STX4964cPnLbG9Vfirr5N2fVoEEAkjCepvqxFtvg/pub?output=csv';
let clothingData = [], userInventory = [];

// 1. BẢNG BASE SCORE (Theo ảnh của bạn)
const baseScoreTable = {
    'sss+': 6660, 'sss': 6000, 'sss-': 5520,
    'ss+': 5280, 'ss': 4800, 'ss-': 4416,
    's++': 4080, 's+': 3760, 's': 3600, 's-': 3360,
    'a+': 2640, 'a': 2400, 'a-': 2200,
    'b+': 1980, 'b': 1800, 'b-': 1660,
    'c+': 1320, 'c': 1200, 'c-': 1104
};

// Hệ số loại đồ
const typeMods = {
    'dress': 1, 'top': 0.5, 'bottom': 0.5, 
    'hair': 0.25, 'shoes': 0.25, 'coat': 0.25, 'makeup': 0.25, 'accessory': 0.1
};

// Hệ số ẩn & Độ hiếm (Tăng 6 sao để Berry Complex lên Top 1)
const rarityMods = { 6: 1.25, 5: 1, 4: 0.8, 3: 0.6, 2: 0.45, 1: 0.3 };
const qualityMods = { 'đồ cực phẩm (top)': 1.25, 'đồ cao cấp': 1.1, 'đồ thông thường': 1 };

// 2. HỆ SỐ 17 CHỦ ĐỀ CHUẨN (Weights)
const arenaData = {
    "tiecvenbien": { simple: 0.67, sexy: 1.33, lively: 1.33, cool: 1.33, cute: 1.33 },
    "kythao": { gorgeous: 1.33, pure: 1.33, elegance: 1.33, cool: 0.67, mature: 1 },
    "noel": { simple: 1.33, pure: 1.33, warm: 1.33, lively: 0.67, mature: 1 },
    "phale": { simple: 1.33, pure: 1.33, elegance: 1.33, cool: 1, cute: 1.33 },
    "tuyet": { gorgeous: 1.33, pure: 1, elegance: 1.33, cool: 0.67, cute: 1.33 },
    "rock": { gorgeous: 1.33, sexy: 1, elegance: 1.33, warm: 0.67, mature: 1.33 },
    "thanhxuan": { simple: 0.67, pure: 1.33, elegance: 1.33, lively: 1, mature: 1.33 },
    "tiectra": { gorgeous: 0.67, pure: 1.33, lively: 1.33, cool: 1, mature: 1.33 },
    "vanphong": { simple: 1.33, pure: 1, elegance: 1.33, cool: 0.67, mature: 1.33 },
    "he": { simple: 1.33, pure: 1, elegance: 1.33, lively: 1.33, cool: 1.33 },
    "xuan": { simple: 1.33, pure: 1, elegance: 1.33, lively: 1.33, cool: 0.67 },
    "vandung": { simple: 1, sexy: 1.33, lively: 1.33, warm: 1.33, mature: 0.67 },
    "thethao": { simple: 1.33, pure: 1.33, lively: 0.67, cool: 1.33, mature: 1 },
    "datiec": { gorgeous: 1.33, sexy: 1.33, elegance: 1.33, warm: 0.67, mature: 1 },
    "nuvuong": { gorgeous: 0.67, sexy: 1.33, lively: 1.33, warm: 1.33, mature: 1 },
    "thamtu": { simple: 1.33, pure: 0.67, sexy: 1.33, elegance: 1.33, mature: 1.33 },
    "ngoisao": { gorgeous: 1.33, sexy: 1.33, lively: 1.33, cool: 0.67, cute: 1 }
};

// 3. KHỞI TẠO
async function init() {
    try {
        const response = await fetch(SHEET_URL);
        const data = await response.text();
        const rows = data.split(/\r?\n/).slice(1);
        userInventory = []; 
        clothingData = rows.map(row => {
            const c = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (c.length < 20) return null;
            if (c[3]?.trim().toUpperCase() === 'TRUE') userInventory.push(c[0].trim());
            return {
                id: c[0].trim(), image: c[1].trim(), name: c[2].trim().replace(/"/g,""), type: c[4].trim().toLowerCase(),
                star: c[5].trim(), quality: c[19].trim(), tags: [c[16]?.trim(), c[17]?.trim()].filter(t => t),
                stats: { gorgeous: c[6], simple: c[7], elegance: c[8], lively: c[9], mature: c[10], cute: c[11], sexy: c[12], pure: c[13], warm: c[14], cool: c[15] }
            };
        }).filter(i => i);
        renderUI();
    } catch (e) { console.error(e); }
}

// 4. TÍNH TOÁN (Hệ số Arena_Scale là mấu chốt)
function calculateEverything() {
    const aid = document.getElementById('arena-select').value;
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

    // Hệ số để khớp với con số Nikki Info (Tùy chỉnh từ 1.2 - 1.35)
    const ARENA_SCALE = 1.315; 

    const types = [...new Set(clothingData.map(i => i.type))];
    let totalScore = 0, bestHtml = "", guideHtml = "";

    types.forEach(type => {
        let scoredItems = clothingData.filter(i => i.type === type).map(item => {
            let s = 0;
            for (let k in w) {
                if (w[k] > 0) {
                    const r = item.stats[k].toLowerCase().trim();
                    const q = item.quality ? item.quality.toLowerCase().trim() : 'đồ thông thường';
                    let base = baseScoreTable[r] || 0;
                    let tMod = typeMods[type] || 0.1;
                    let rMod = rarityMods[item.star] || 1;
                    let qMod = qualityMods[q] || 1;
                    s += (base * tMod * rMod * qMod) * w[k];
                }
            }
            
            s *= ARENA_SCALE; // Nhân hệ số khu thi đấu
            if (stag && item.tags.includes(stag)) s *= 2.2; // Nhân Tag
            
            return { ...item, finalScore: Math.round(s) };
        }).sort((a,b) => b.finalScore - a.finalScore);

        const best = scoredItems.find(i => userInventory.includes(i.id));
        if (best) {
            totalScore += best.finalScore;
            bestHtml += `<li><img src="${best.image}" class="item-thumb"><div><b>${type.toUpperCase()}:</b> ${best.name}<br><small>Điểm: ${best.finalScore.toLocaleString()}</small></div></li>`;
        }
        guideHtml += `<div class="guide-cat"><div class="guide-title" onclick="this.nextElementSibling.classList.toggle('active')">${type.toUpperCase()} (Top 20)</div>
        <ul class="guide-list active">${scoredItems.slice(0,20).map((i,idx) => `<li class="${userInventory.includes(i.id)?'is-owned':'not-owned'}">#${idx+1} ${i.name} ★${i.star} [${i.finalScore.toLocaleString()}]</li>`).join('')}</ul></div>`;
    });

    document.getElementById('total-score-val').innerText = totalScore.toLocaleString();
    document.getElementById('best-set-list').innerHTML = bestHtml;
    document.getElementById('advanced-guide').innerHTML = guideHtml;
    document.getElementById('result-container').style.display = 'block';
}

// 5. CÁC HÀM UI (Giữ nguyên)
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
    document.getElementById('item-lists').innerHTML = items.map(i => `<label class="item-checkbox"><input type="checkbox" value="${i.id}" ${userInventory.includes(i.id)?'checked':''} onchange="toggleItem('${i.id}', this.checked)"><img src="${i.image}" class="item-thumb"><div><b>${i.name}</b><br><small>★${i.star}</small></div></label>`).join('');
}
function toggleItem(id, own) { if(own) userInventory.push(id); else userInventory = userInventory.filter(i => i!==id); }
function saveInventory() { localStorage.setItem('inventory', JSON.stringify(userInventory)); alert("Đã lưu!"); }
function applyArenaWeights() {
    const aid = document.getElementById('arena-select').value;
    const attrs = ['simple','gorgeous','pure','sexy','elegance','lively','warm','cool','cute','mature'];
    attrs.forEach(a => document.getElementById(`w-${a}`).value = 0);
    if (aid && arenaData[aid]) {
        for (let k in arenaData[aid]) document.getElementById(`w-${k}`).value = arenaData[aid][k];
        calculateEverything();
    }
}
init();
