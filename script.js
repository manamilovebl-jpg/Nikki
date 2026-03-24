const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQvuIgcVvxltqjqcALb8tpaG-pmhY7VmV9G7AB0STX4964cPnLbG9Vfirr5N2fVoEEAkjCepvqxFtvg/pub?output=csv';
let clothingData = [], userInventory = [];

// 1. Bảng điểm Base trung bình từ tab Thông Tin
const rankBase = { 'sss': 600, 'ss': 490, 's': 400, 'a': 320, 'b': 240, 'c': 160 };

// 2. Hệ số nhân theo vị trí đồ
const typeMultipliers = {
    'dress': 10, 'top': 5, 'bottom': 5, 'hair': 2.5, 'shoes': 2.5, 'coat': 2.5, 'makeup': 2.5, 'accessory': 1
};

// 3. Hệ số ẩn dựa trên Cột T (Phẩm chất đồ)
const qualityMultipliers = {
    'đồ cực phẩm (top)': 1.25,
    'đồ cao cấp': 1.1,
    'đồ thông thường': 1,
    'top': 1.25 // Dự phòng trường hợp chỉ ghi "Top"
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

function calculateNikkiScore(rank, type, star, quality) {
    if (!rank) return 0;
    const r = rank.trim().toLowerCase();
    const t = type.trim().toLowerCase();
    const q = quality ? quality.trim().toLowerCase() : 'đồ thông thường';
    
    let base = rankBase[r] || 0;
    let multiplier = typeMultipliers[t] || 1;
    let qualityMod = qualityMultipliers[q] || 1;
    
    const starBonus = (parseInt(star) || 0) * 5; 

    // CÔNG THỨC: (Base + StarBonus) * Vị trí * Hệ số ẩn Cột T
    let finalScore = (base + starBonus) * multiplier * qualityMod;

    // Penalty cho Accessory
    if (multiplier === 1) finalScore *= 0.4;

    return finalScore;
}

async function init() {
    try {
        const response = await fetch(SHEET_URL);
        const csvData = await response.text();
        const rows = csvData.split('\n').slice(1);
        userInventory = []; 

        clothingData = rows.map(row => {
            const c = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (c.length < 20) return null; // Đảm bảo đọc đến được cột T
            
            const id = c[0]?.trim();
            const type = c[4]?.trim().toLowerCase();
            const star = c[5]?.trim();
            const quality = c[19]?.trim(); // CỘT T (Index 19)

            if (c[3]?.trim().toUpperCase() === 'TRUE') userInventory.push(id);

            return {
                id, image: c[1]?.trim(), name: c[2]?.trim().replace(/"/g, ""), type, star, quality,
                tags: [c[16]?.trim(), c[17]?.trim()].filter(t => t),
                stats: {
                    gorgeous: c[6], simple: c[7], elegance: c[8], lively: c[9], mature: c[10], 
                    cute: c[11], sexy: c[12], pure: c[13], warm: c[14], cool: c[15]
                }
            };
        }).filter(i => i);
        renderUI();
    } catch (e) { console.error(e); }
}

function calculateEverything() {
    const stag = document.getElementById('tag-select').value;
    const w = {
        gorgeous: parseFloat(document.getElementById('w-gorgeous').value) || 0.1,
        simple: parseFloat(document.getElementById('w-simple').value) || 0.1,
        pure: parseFloat(document.getElementById('w-pure').value) || 0.1,
        sexy: parseFloat(document.getElementById('w-sexy').value) || 0.1,
        elegance: parseFloat(document.getElementById('w-elegance').value) || 0.1,
        lively: parseFloat(document.getElementById('w-lively').value) || 0.1,
        warm: parseFloat(document.getElementById('w-warm').value) || 0.1,
        cool: parseFloat(document.getElementById('w-cool').value) || 0.1,
        cute: parseFloat(document.getElementById('w-cute').value) || 0.1,
        mature: parseFloat(document.getElementById('w-mature').value) || 0.1
    };

    const types = [...new Set(clothingData.map(i => i.type))];
    let totalScore = 0, bestHtml = "", guideHtml = "";

    types.forEach(type => {
        let scoredItems = clothingData.filter(i => i.type === type).map(item => {
            let s = 0;
            for (let k in w) {
                const baseValue = calculateNikkiScore(item.stats[k], type, item.star, item.quality);
                s += baseValue * w[k];
            }
            if (stag && item.tags.includes(stag)) s *= 2.5; // Tăng hệ số Tag lên 2.5 cho sát thực tế
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

// Các hàm phụ trợ giữ nguyên
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
