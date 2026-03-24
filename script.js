const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQvuIgcVvxltqjqcALb8tpaG-pmhY7VmV9G7AB0STX4964cPnLbG9Vfirr5N2fVoEEAkjCepvqxFtvg/pub?output=csv';
let clothingData = [], userInventory = [];

// 1. BẢNG BASE SCORE (Dữ liệu chuẩn từ ảnh của bạn)
const baseTable = { 
    'sss+': 6660, 'sss': 6000, 'sss-': 5520, 
    'ss+': 5280, 'ss': 4800, 'ss-': 4416, 
    's++': 4080, 's+': 3760, 's': 3600, 's-': 3360, 
    'a+': 2640, 'a': 2400, 'a-': 2200, 
    'b+': 1980, 'b': 1800, 'b-': 1660, 
    'c+': 1320, 'c': 1200, 'c-': 1104 
};

const typeMods = { 'dress': 1, 'top': 0.5, 'bottom': 0.5, 'hair': 0.25, 'shoes': 0.25, 'coat': 0.25, 'makeup': 0.25, 'accessory': 0.1 };
const rarityMods = { 6: 1.25, 5: 1, 4: 0.8, 3: 0.6, 2: 0.45, 1: 0.3 };
const qualityMods = { 'đồ cực phẩm (top)': 1.25, 'đồ cao cấp': 1.1, 'đồ thông thường': 1 };

// 2. HỆ SỐ 17 CHỦ ĐỀ CHUẨN
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

// 3. KHỞI TẠO DỮ LIỆU (Cập nhật cột AB - Index 27)
async function init() {
    try {
        const res = await fetch(SHEET_URL);
        const data = await res.text();
        const rows = data.split(/\r?\n/).slice(1);
        userInventory = JSON.parse(localStorage.getItem('inventory')) || [];
        
        clothingData = rows.map(row => {
            const c = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (c.length < 28) return null;
            
            const id = c[0].trim();
            // Nếu Sheet đánh dấu TRUE thì tự động thêm vào túi đồ
            if (c[3]?.trim().toUpperCase() === 'TRUE' && !userInventory.includes(id)) {
                userInventory.push(id);
            }

            return {
                id: id,
                image: c[1].trim(), 
                name: c[27]?.trim().replace(/"/g,"") || c[2].trim().replace(/"/g,""), // Cột AB
                type: c[4].trim().toLowerCase(),
                star: parseInt(c[5]) || 5,
                quality: c[19]?.trim() || 'đồ thông thường',
                tags: [c[16]?.trim(), c[17]?.trim()].filter(t => t),
                stats: { 
                    gorgeous: c[6], simple: c[7], elegance: c[8], lively: c[9], 
                    mature: c[10], cute: c[11], sexy: c[12], pure: c[13], 
                    warm: c[14], cool: c[15] 
                }
            };
        }).filter(i => i);
        renderUI();
    } catch (e) { console.error("Lỗi tải dữ liệu:", e); }
}

// 4. HÀM TÍNH TOÁN (Cấu trúc mới để khớp điểm)
function calculateEverything() {
    const stag = document.getElementById('tag-select').value;
    const ARENA_SCALE = 1.315; 
    
    // Lấy trọng số từ UI
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
    let totalScore = 0, bestHtml = "", guideHtml = "";

    types.forEach(type => {
        let scoredItems = clothingData.filter(i => i.type === type).map(item => {
            let s = 0;
            // Bước 1: Cộng dồn điểm thuộc tính * Trọng số ải
            for (let k in w) {
                if (w[k] > 0) {
                    const rank = item.stats[k] ? item.stats[k].toLowerCase().trim() : '';
                    const base = baseTable[rank] || 0;
                    const tMod = typeMods[type] || 0.1;
                    const rMod = rarityMods[item.star] || 1;
                    const qMod = qualityMods[item.quality.toLowerCase()] || 1;
                    
                    s += (base * tMod * rMod * qMod) * w[k];
                }
            }
            
            // Bước 2: Nhân hệ số Arena Scale
            s *= ARENA_SCALE;

            // Bước 3: Nhân hệ số Tag (Ưu tiên cực mạnh)
            if (stag && item.tags.includes(stag)) {
                s *= 2.15; 
            }
            
            return { ...item, finalScore: Math.round(s) };
        }).sort((a,b) => b.finalScore - a.finalScore);

        // Hiển thị Bộ đồ tốt nhất bạn có
        const best = scoredItems.find(i => userInventory.includes(i.id));
        if (best) {
            totalScore += best.finalScore;
            bestHtml += `<li><img src="${best.image}" class="item-thumb"> <b>${type.toUpperCase()}</b>: ${best.name} [${best.finalScore.toLocaleString()}]</li>`;
        }
        
        // Hiển thị Top 20 Rankings (2 Cột)
        guideHtml += `
            <div class="guide-cat">
                <div class="guide-title" onclick="this.nextElementSibling.classList.toggle('active')">
                    ${type.toUpperCase()} <span>▼</span>
                </div>
                <ul class="guide-list active">
                    ${scoredItems.slice(0, 20).map((i, idx) => `
                        <li class="${userInventory.includes(i.id) ? 'is-owned' : 'not-owned'}">
                            <img src="${i.image}" class="guide-img" onerror="this.src='https://via.placeholder.com/40'">
                            <div class="guide-info">
                                <span class="guide-name">${i.name}</span>
                                <small>★${i.star}</small>
                            </div>
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

// 5. CÁC HÀM UI BỔ TRỢ
function renderUI() {
    const cats = [...new Set(clothingData.map(i => i.type))];
    document.getElementById('category-tabs').innerHTML = cats.map(cat => `<button class="tab-btn" onclick="showCat('${cat}')">${cat.toUpperCase()}</button>`).join('');
    const allTags = [...new Set(clothingData.flatMap(i => i.tags))].sort();
    document.getElementById('tag-select').innerHTML = '<option value="">-- Chọn Tag --</option>' + allTags.map(t => `<option value="${t}">${t}</option>`).join('');
    showCat(cats[0]);
}

function showCat(type) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.innerText.toLowerCase() === type.toLowerCase()));
    const items = clothingData.filter(i => i.type === type);
    document.getElementById('item-lists').innerHTML = items.map(i => `
        <label class="item-checkbox">
            <input type="checkbox" value="${i.id}" ${userInventory.includes(i.id)?'checked':''} onchange="toggleItem('${i.id}', this.checked)">
            <img src="${i.image}" class="item-thumb"> 
            <span>${i.name}</span>
        </label>`).join('');
}

function toggleItem(id, own) {
    if(own) { if(!userInventory.includes(id)) userInventory.push(id); }
    else { userInventory = userInventory.filter(i => i !== id); }
}

function saveInventory() {
    localStorage.setItem('inventory', JSON.stringify(userInventory));
    alert("Đã lưu tủ đồ thành công!");
}

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
