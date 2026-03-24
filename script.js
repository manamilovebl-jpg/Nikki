const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQvuIgcVvxltqjqcALb8tpaG-pmhY7VmV9G7AB0STX4964cPnLbG9Vfirr5N2fVoEEAkjCepvqxFtvg/pub?output=csv';
let clothingData = [], userInventory = [];

// 1. BẢNG BASE SCORE (Giữ nguyên từ ảnh của bạn)
const baseScoreTable = {
    'sss+': { dress: 6660, top: 3330, hair: 1665, accessory: 666 },
    'sss':  { dress: 6000, top: 3000, hair: 1500, accessory: 600 },
    'sss-': { dress: 5520, top: 2760, hair: 1380, accessory: 552 },
    'ss+':  { dress: 5280, top: 2640, hair: 1320, accessory: 528 },
    'ss':   { dress: 4800, top: 2400, hair: 1200, accessory: 480 },
    'ss-':  { dress: 4416, top: 2208, hair: 1104, accessory: 441.6 },
    's++':  { dress: 4080, top: 2040, hair: 1020, accessory: 408 },
    's+':   { dress: 3760, top: 1880, hair: 940,  accessory: 376 },
    's':    { dress: 3600, top: 1800, hair: 900,  accessory: 360 },
    's-':   { dress: 3360, top: 1680, hair: 840,  accessory: 336 },
    'a+':   { dress: 2640, top: 1320, hair: 660,  accessory: 264 },
    'a':    { dress: 2400, top: 1200, hair: 600,  accessory: 240 },
    'a-':   { dress: 2200, top: 1100, hair: 550,  accessory: 220 },
    'b+':   { dress: 1980, top: 990,  hair: 495,  accessory: 198 },
    'b':    { dress: 1800, top: 900,  hair: 450,  accessory: 180 },
    'b-':   { dress: 1660, top: 830,  hair: 415,  accessory: 166 },
    'c+':   { dress: 1320, top: 660,  hair: 330,  accessory: 132 },
    'c':    { dress: 1200, top: 600,  hair: 300,  accessory: 120 },
    'c-':   { dress: 1104, top: 552,  hair: 276,  accessory: 110.4 }
};

const rarityMultipliers = { 6: 1.15, 5: 1, 4: 0.8, 3: 0.6, 2: 0.45, 1: 0.3 };
const qualityMultipliers = { 'đồ cực phẩm (top)': 1.25, 'đồ cao cấp': 1.1, 'đồ thông thường': 1 };

// 2. KHỞI TẠO DỮ LIỆU (Sửa lỗi Load)
async function init() {
    try {
        const response = await fetch(SHEET_URL);
        const csvText = await response.text();
        
        // Dùng Regex để tách CSV chuẩn kể cả khi có dấu phẩy trong ngoặc kép
        const rows = csvText.split(/\r?\n/).slice(1); 
        userInventory = []; 

        clothingData = rows.map(row => {
            // Regex tách cột chuẩn CSV
            const c = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (c.length < 15) return null;

            const id = c[0]?.trim();
            if (c[3]?.trim().toUpperCase() === 'TRUE') userInventory.push(id);

            return {
                id: id,
                image: c[1]?.trim() || '',
                name: c[2]?.trim().replace(/"/g, ""),
                type: c[4]?.trim().toLowerCase(),
                star: c[5]?.trim(),
                quality: c[19]?.trim() || 'đồ thông thường', // Cột T
                tags: [c[16]?.trim(), c[17]?.trim()].filter(t => t && t !== ""),
                stats: {
                    gorgeous: c[6], simple: c[7], elegance: c[8], lively: c[9], mature: c[10], 
                    cute: c[11], sexy: c[12], pure: c[13], warm: c[14], cool: c[15]
                }
            };
        }).filter(item => item && item.id);

        console.log("Đã tải:", clothingData.length, "món đồ.");
        renderUI();
    } catch (e) {
        console.error("Lỗi load tủ đồ:", e);
        document.getElementById('item-lists').innerHTML = "Lỗi kết nối Sheets. Hãy kiểm tra link Pub.";
    }
}

// 3. LOGIC TÍNH ĐIỂM (Giữ nguyên bản Step-by-Step)
function getBaseItemScore(rank, type, star, quality) {
    if (!rank) return 0;
    const r = rank.toLowerCase().trim();
    const t = type.toLowerCase().trim();
    const q = quality ? quality.toLowerCase().trim() : 'đồ thông thường';

    let group = 'accessory';
    if (t === 'dress') group = 'dress';
    else if (t === 'top' || t === 'bottom') group = 'top';
    else if (['hair', 'shoes', 'coat'].includes(t)) group = 'hair';

    const base = baseScoreTable[r] ? (baseScoreTable[r][group] || baseScoreTable[r]['accessory']) : 0;
    const rarityMod = rarityMultipliers[star] || 1;
    const qualityMod = qualityMultipliers[q] || 1;

    return base * rarityMod * qualityMod;
}

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

    const types = [...new Set(clothingData.map(i => i.type))];
    types.sort((a,b) => (a.includes('accessory') ? 1 : -1));

    let totalScore = 0, bestHtml = "", guideHtml = "", accCount = 0;

    types.forEach(type => {
        let scoredItems = clothingData.filter(i => i.type === type).map(item => {
            let itemTotal = 0;
            const attrs = Object.keys(w);
            attrs.forEach(attr => {
                if (w[attr] > 0) {
                    const rank = item.stats[attr];
                    const base = getBaseItemScore(rank, type, item.star, item.quality);
                    itemTotal += Math.floor(base * w[attr]);
                }
            });
            if (stag && item.tags.includes(stag)) itemTotal = Math.floor(itemTotal * 2);
            return { ...item, finalScore: itemTotal };
        }).sort((a,b) => b.finalScore - a.finalScore);

        const best = scoredItems.find(i => userInventory.includes(i.id));
        if (best) {
            let s = best.finalScore;
            if (type.includes('accessory')) {
                accCount++;
                const penalties = [1, 1, 1, 0.95, 0.95, 0.9, 0.9, 0.9, 0.9, 0.9, 0.8]; // Ví dụ hệ số phạt
                const p = accCount > 10 ? 0.7 : (penalties[accCount-1] || 0.7);
                s = Math.floor(s * p);
            }
            totalScore += s;
            bestHtml += `<li><img src="${best.image}" class="item-thumb"><div><b>${type.toUpperCase()}:</b> ${best.name}<br><small>Điểm: ${s.toLocaleString()}</small></div></li>`;
        }

        guideHtml += `<div class="guide-cat"><div class="guide-title" onclick="this.nextElementSibling.classList.toggle('active')">${type.toUpperCase()}</div>
        <ul class="guide-list">${scoredItems.slice(0,20).map((i,idx) => `<li class="${userInventory.includes(i.id)?'is-owned':'not-owned'}">#${idx+1} ${i.name} ★${i.star} [${i.finalScore.toLocaleString()}]</li>`).join('')}</ul></div>`;
    });

    document.getElementById('total-score-val').innerText = Math.round(totalScore).toLocaleString();
    document.getElementById('best-set-list').innerHTML = bestHtml;
    document.getElementById('advanced-guide').innerHTML = guideHtml;
    document.getElementById('result-container').style.display = 'block';
}

// UI HELPERS (Giữ nguyên)
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
    // Tự động điền hệ số ải... (Phần này bạn dán lại arenaData từ bản trước vào là xong)
    calculateEverything();
}
init();
