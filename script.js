const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQvuIgcVvxltqjqcALb8tpaG-pmhY7VmV9G7AB0STX4964cPnLbG9Vfirr5N2fVoEEAkjCepvqxFtvg/pub?output=csv';
let clothingData = [], userInventory = [];

// 1. BẢNG BASE SCORE CHUẨN (Cập nhật đầy đủ biến thể +-, ++)
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

// 2. HỆ SỐ ĐỘ HIẾM (1-6 Tim)
const rarityMultipliers = { 6: 1.15, 5: 1, 4: 0.8, 3: 0.6, 2: 0.45, 1: 0.3 };

// 3. HỆ SỐ PHẨM CHẤT (Ẩn - Cột T)
const qualityMultipliers = { 'đồ cực phẩm (top)': 1.25, 'đồ cao cấp': 1.1, 'đồ thông thường': 1 };

// 4. HỆ SỐ TRỌNG SỐ ẢI (Cập nhật chuẩn theo bảng 17 chủ đề)
const arenaData = {
    "tiecvenbien": { simple: 0.67, gorgeous: 0, pure: 0, sexy: 1.33, elegance: 0, lively: 1, warm: 0, cool: 1.33, cute: 0, mature: 1.33 },
    "vanphong": { simple: 1.33, gorgeous: 0, pure: 0, sexy: 1, elegance: 1.33, lively: 0, warm: 0, cool: 0.67, cute: 0, mature: 1.33 },
    "noel": { simple: 1.33, gorgeous: 0, pure: 1.33, sexy: 0, elegance: 0, lively: 0.67, warm: 1.33, cool: 0, cute: 0, mature: 1 },
    "vandung": { simple: 1, gorgeous: 0, pure: 0, sexy: 1.33, elegance: 0, lively: 1.33, warm: 1.33, cool: 0, cute: 0, mature: 0.67 },
    "xuan": { simple: 1.33, gorgeous: 0, pure: 1, sexy: 0, elegance: 1.33, lively: 0, warm: 0, cool: 0.67, cute: 0, mature: 1.33 },
    "he": { simple: 1.33, gorgeous: 0, pure: 1, sexy: 0, elegance: 1.33, lively: 0, warm: 0, cool: 1.33, cute: 0, mature: 0.67 },
    "thethao": { simple: 1.33, gorgeous: 0, pure: 1.33, sexy: 0, elegance: 0, lively: 0.67, warm: 0, cool: 1.33, cute: 0, mature: 1 },
    "thamtu": { simple: 0, gorgeous: 1.33, pure: 0.67, sexy: 1.33, elegance: 1, lively: 0, warm: 0, cool: 0, cute: 0, mature: 1.33 },
    "rock": { simple: 1.33, gorgeous: 0, pure: 0, sexy: 1.33, elegance: 1.33, lively: 0.67, warm: 0, cool: 0, cute: 0, mature: 1.33 },
    "thanhxuan": { simple: 0, gorgeous: 0.67, pure: 1.33, sexy: 0, elegance: 1.33, lively: 1, warm: 0, cool: 0, cute: 0, mature: 1.33 },
    "tiectra": { simple: 0, gorgeous: 0.67, pure: 1.33, sexy: 0, elegance: 0, lively: 1.33, warm: 0, cool: 1, cute: 0, mature: 1.33 },
    "datiec": { gorgeous: 1.33, elegance: 1.33, sexy: 1.33, mature: 1, warm: 0.67 }, // Nữ Vương
    "nuvuong": { gorgeous: 0.67, sexy: 1.33, elegance: 0, lively: 1.33, warm: 1.33, mature: 1 }, // Ngọn lửa ngày đông
    "ngoisao": { gorgeous: 1.33, sexy: 1.33, elegance: 1.33, lively: 0.67, mature: 1 }, // Vũ hội cung đình
    "tuyet": { gorgeous: 1.33, pure: 1, elegance: 1.33, cool: 0.67, cute: 1.33 }, // Công viên cổ tích
    "kythao": { gorgeous: 1.33, pure: 1.33, elegance: 1.33, cool: 0.67, mature: 1 }, // Đẹp tuyệt trần
    "phale": { gorgeous: 0, gorgeous: 0, pure: 1.33, sexy: 0, elegance: 1.33, lively: 0, warm: 0, cool: 1, cute: 1.33, mature: 0.67 } // Đẹp thanh tú
};

// 5. HÀM TÍNH ĐIỂM CHI TIẾT
function calculateFullScore(rank, type, stars, quality) {
    if (!rank) return 0;
    const r = rank.toLowerCase().trim();
    const t = type.toLowerCase().trim();
    const q = quality ? quality.toLowerCase().trim() : 'đồ thông thường';

    // Xác định nhóm vị trí để lấy Base
    let group = 'accessory';
    if (t === 'dress') group = 'dress';
    else if (t === 'top' || t === 'bottom') group = 'top';
    else if (['hair', 'shoes', 'coat'].includes(t)) group = 'hair';

    const base = baseScoreTable[r] ? (baseScoreTable[r][group] || baseScoreTable[r]['accessory']) : 0;
    const rarityMod = rarityMultipliers[stars] || 1;
    const qualityMod = qualityMultipliers[q] || 1;

    // Công thức: Base * Hệ số Tim * Hệ số Phẩm chất
    return base * rarityMod * qualityMod;
}

// 6. HÀM TÍNH PENALTY PHỤ KIỆN
function getAccessoryPenalty(count) {
    if (count <= 3) return 1;
    if (count <= 5) return 0.95;
    if (count <= 10) return 0.9;
    if (count <= 15) return 0.8;
    return 0.7;
}

async function calculateEverything() {
    const aid = document.getElementById('arena-select').value;
    const weights = {};
    const attrs = ['simple','gorgeous','pure','sexy','elegance','lively','warm','cool','cute','mature'];
    attrs.forEach(a => weights[a] = parseFloat(document.getElementById(`w-${a}`).value) || 0);

    const types = [...new Set(clothingData.map(i => i.type))];
    let bestOwnedList = [], guideHtml = "";
    let accessoryCount = 0;

    // Sắp xếp các loại đồ để tính Penalty Phụ kiện (Accessory thường tính sau cùng)
    types.sort((a, b) => (a.includes('accessory') ? 1 : -1));

    types.forEach(type => {
        let scoredItems = clothingData.filter(i => i.type === type).map(item => {
            let s = 0;
            // Thuộc tính Map: QP->gorgeous, ĐG->simple, GC->pure, TS->sexy, TL->elegance, NĐ->lively, GẤ->warm, MM->cool, TT->cute, DT->mature
            const attrMap = { gorgeous: 'c6', simple: 'c7', elegance: 'c8', lively: 'c9', mature: 'c10', cute: 'c11', sexy: 'c12', pure: 'c13', warm: 'c14', cool: 'c15' };
            
            for (let k in weights) {
                if (weights[k] > 0) {
                    const rank = item.stats[k]; // Lấy rank từ cột tương ứng
                    s += calculateFullScore(rank, type, item.star, item.quality) * weights[k];
                }
            }
            
            // Hệ số Tag Đặc biệt (Nếu có cột Tag và ải yêu cầu) - Giả định x2 (Quan trọng) hoặc x5 (Bắt buộc)
            // Bạn có thể thêm logic Tag ở đây nếu muốn.

            return { ...item, finalScore: Math.round(s) };
        }).sort((a,b) => b.finalScore - a.finalScore);

        // Tìm món tốt nhất bạn có
        const bestOwned = scoredItems.find(i => userInventory.includes(i.id));
        if (bestOwned) {
            let score = bestOwned.finalScore;
            if (type.includes('accessory')) {
                accessoryCount++;
                score *= getAccessoryPenalty(accessoryCount);
            }
            bestOwnedList.push({ ...bestOwned, displayScore: Math.round(score) });
        }

        // Top 20 Rankings
        const top20 = scoredItems.slice(0, 20);
        guideHtml += `<div class="guide-cat"><div class="guide-title" onclick="this.nextElementSibling.classList.toggle('active')">${type.toUpperCase()}</div>
        <ul class="guide-list">${top20.map((i,idx) => `<li class="${userInventory.includes(i.id)?'is-owned':'not-owned'}">#${idx+1} ${i.name} [${i.finalScore}]</li>`).join('')}</ul></div>`;
    });

    // Render kết quả...
}
