const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQvuIgcVvxltqjqcALb8tpaG-pmhY7VmV9G7AB0STX4964cPnLbG9Vfirr5N2fVoEEAkjCepvqxFtvg/pub?output=csv';
let clothingData = [];
let userInventory = [];

// --- BẢNG ĐIỂM CHUẨN NIKKI INFO ---
const baseTable = { 
    'sss+': 6660, 'sss': 6000, 'sss-': 5520, 
    'ss+': 5280, 'ss': 4800, 'ss-': 4416, 
    's++': 4080, 's+': 3760, 's': 3600, 's-': 3360, 
    'a+': 2640, 'a': 2400, 'a-': 2200, 
    'b+': 1980, 'b': 1800, 'b-': 1660, 
    'c+': 1320, 'c': 1200, 'c-': 1104 
};

const typeMods = { 
    'dress': 1, 'top': 0.5, 'bottom': 0.5, 'hair': 0.25, 
    'shoes': 0.25, 'coat': 0.25, 'makeup': 0.25, 'accessory': 0.1 
};

const rarityMods = { 
    '6': 1.25, '5': 1, '4': 0.8, '3': 0.6, '2': 0.45, '1': 0.3 
};

const qualityMods = { 
    'đồ cực phẩm (top)': 1.25, 'đồ cao cấp': 1.1, 'đồ thông thường': 1 
};

// --- KHỞI TẠO DỮ LIỆU ---
async function init() {
    try {
        console.log("Đang tải dữ liệu từ Sheets...");
        const response = await fetch(SHEET_URL);
        const csvData = await response.text();
        const rows = csvData.split(/\r?\n/);
        
        // Lấy tủ đồ đã lưu trong máy
        const savedInventory = localStorage.getItem('inventory');
        userInventory = savedInventory ? JSON.parse(savedInventory) : [];
        
        clothingData = []; // Xóa dữ liệu cũ trước khi nạp mới

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row.trim()) continue;

            // Regex tách cột chuẩn (xử lý dấu phẩy trong ngoặc kép)
            const c = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (c.length < 28) continue;

            const id = c[0].trim(); // Cột A
            const nameOriginal = c[2]?.trim().replace(/"/g,""); // Cột C
            const type = c[4]?.trim().toLowerCase(); // Cột E
            const star = c[5]?.trim(); // Cột F
            const isOwnedInSheet = c[3]?.trim().toUpperCase() === 'TRUE'; // Cột D
            const quality = c[19]?.trim() || 'đồ thông thường'; // Cột T
            const nameVN = c[27]?.trim().replace(/"/g,""); // Cột AB

            // Nếu trong Sheet đánh dấu TRUE, tự động thêm vào tủ đồ nếu chưa có
            if (isOwnedInSheet && !userInventory.includes(id)) {
                userInventory.push(id);
            }

            // Xử lý lấy ảnh Icon từ Nikki Info (Xóa chữ H, D... chỉ lấy số)
            const cleanID = id.replace(/\D/g, "");
            const iconUrl = `https://nikki.info/static/images/items/${cleanID}.png`;

            const item = {
                id: id,
                image: iconUrl,
                name: nameVN || nameOriginal || "Không tên",
                type: type,
                star: star,
                quality: quality,
                tags: [c[16]?.trim(), c[17]?.trim()].filter(t => t && t !== ""),
                stats: {
                    gorgeous: c[6]?.trim(), simple: c[7]?.trim(), elegance: c[8]?.trim(),
                    lively: c[9]?.trim(), mature: c[10]?.trim(), cute: c[11]?.trim(),
                    sexy: c[12]?.trim(), pure: c[13]?.trim(), warm: c[14]?.trim(), cool: c[15]?.trim()
                }
            };
            clothingData.push(item);
        }

        console.log("Đã nạp " + clothingData.length + " món đồ.");
        renderUI();
    } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
        alert("Không thể tải dữ liệu. Hãy kiểm tra link Sheets!");
    }
}

// --- LOGIC TÍNH TOÁN CHI TIẾT ---
function calculateEverything() {
    const arenaTag = document.getElementById('tag-select').value;
    const ARENA_SCALE = 1.315; 
    
    // Lấy trọng số từ các ô nhập liệu
    const weights = {
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

    const allTypes = [...new Set(clothingData.map(item => item.type))];
    let scoredItemsGrouped = {};

    // 1. Tính điểm cho từng món đồ
    allTypes.forEach(type => {
        const itemsInType = clothingData.filter(item => item.type === type);
        
        scoredItemsGrouped[type] = itemsInType.map(item => {
            let score = 0;
            // Xác định Mod theo loại đồ
            let groupMod = typeMods['accessory'];
            if (type === 'dress') groupMod = typeMods['dress'];
            else if (type === 'top' || type === 'bottom') groupMod = typeMods['top'];
            else if (['hair', 'shoes', 'coat', 'makeup'].includes(type)) groupMod = typeMods[type];

            for (let attr in weights) {
                if (weights[attr] > 0) {
                    const rank = item.stats[attr] ? item.stats[attr].toLowerCase() : '';
                    const base = baseTable[rank] || 0;
                    const rMod = rarityMods[item.star] || 1;
                    const qMod = qualityMods[item.quality.toLowerCase()] || 1;
                    score += (base * groupMod * rMod * qMod) * weights[attr];
                }
            }
            
            score *= ARENA_SCALE;
            if (arenaTag && item.tags.includes(arenaTag)) score *= 2.15;
            
            return { ...item, finalScore: Math.round(score) };
        }).sort((a, b) => b.finalScore - a.finalScore);
    });

    // 2. Chọn bộ đồ mạnh nhất bạn đang có
    let bestSet = [];
    let totalScore = 0;

    const findBestOwned = (type) => (scoredItemsGrouped[type] || []).find(i => userInventory.includes(i.id));

    const bDress = findBestOwned('dress');
    const bTop = findBestOwned('top');
    const bBottom = findBestOwned('bottom');

    const scoreDress = bDress ? bDress.finalScore : 0;
    const scoreTopBottom = (bTop ? bTop.finalScore : 0) + (bBottom ? bBottom.finalScore : 0);

    // So sánh Đầm vs Áo+Quần
    if (scoreDress >= scoreTopBottom && bDress) {
        bestSet.push(bDress);
        totalScore += scoreDress;
    } else {
        if (bTop) { bestSet.push(bTop); totalScore += bTop.finalScore; }
        if (bBottom) { bestSet.push(bBottom); totalScore += bBottom.finalScore; }
    }

    // Lấy các món còn lại
    allTypes.forEach(type => {
        if (!['dress', 'top', 'bottom'].includes(type)) {
            const item = findBestOwned(type);
            if (item) {
                bestSet.push(item);
                totalScore += item.finalScore;
            }
        }
    });

    // 3. Hiển thị Kết quả Bộ Đồ Mạnh Nhất
    document.getElementById('total-score-val').innerText = totalScore.toLocaleString();
    document.getElementById('best-set-list').innerHTML = bestSet.map(i => `
        <li>
            <img src="${i.image}" class="img-square" onerror="this.src='https://via.placeholder.com/80?text=No+Icon'">
            <div class="item-card-content">
                <div class="item-id-info">${i.type} no. ${i.id}</div>
                <div class="item-name-text" style="color:var(--pink)">${i.name}</div>
                <div class="score-tag">${i.finalScore.toLocaleString()}</div>
            </div>
        </li>
    `).join('');

    // 4. Hiển thị Rankings Top 20 (2 cột)
    let guideHtml = "";
    allTypes.sort().forEach(type => {
        const top20 = scoredByTypeGrouped[type].slice(0, 20);
        guideHtml += `
            <div class="guide-cat">
                <div class="guide-title" onclick="this.nextElementSibling.classList.toggle('active')">
                    ${type.toUpperCase()} <span>▼</span>
                </div>
                <ul class="guide-list active">
                    ${top20.map((i, idx) => `
                        <li class="${userInventory.includes(i.id) ? 'is-owned' : 'not-owned'}">
                            <img src="${i.image}" class="img-square" onerror="this.src='https://via.placeholder.com/80?text=No+Icon'">
                            <div class="item-card-content">
                                <div class="item-id-info">${i.type} no. ${i.id}</div>
                                <div class="item-name-text">#${idx+1} ${i.name}</div>
                                <div class="item-links">Copy permalink | name</div>
                                <div class="guide-meta">
                                    <small>★${i.star} ${userInventory.includes(i.id) ? '✅' : ''}</small>
                                    <b class="score-tag">${i.finalScore.toLocaleString()}</b>
                                </div>
                            </div>
                        </li>
                    `).join('')}
                </ul>
            </div>`;
    });
    document.getElementById('advanced-guide').innerHTML = guideHtml;
    document.getElementById('result-container').style.display = 'block';
}

// --- CÁC HÀM GIAO DIỆN (TỦ ĐỒ) ---
function renderUI() {
    const cats = [...new Set(clothingData.map(i => i.type))].sort();
    const tabContainer = document.getElementById('category-tabs');
    tabContainer.innerHTML = cats.map(cat => `<button class="tab-btn" onclick="showCat('${cat}')">${cat.toUpperCase()}</button>`).join('');
    
    const allTags = [...new Set(clothingData.flatMap(i => i.tags))].sort();
    document.getElementById('tag-select').innerHTML = '<option value="">-- Chọn Tag --</option>' + allTags.map(t => `<option value="${t}">${t}</option>`).join('');
    
    if (cats.length > 0) showCat(cats[0]);
}

function showCat(type) {
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => {
        if (btn.innerText.toLowerCase() === type.toLowerCase()) btn.classList.add('active');
        else btn.classList.remove('active');
    });

    const items = clothingData.filter(i => i.type === type);
    const container = document.getElementById('item-lists');
    
    container.innerHTML = items.map(i => `
        <label class="item-checkbox ${userInventory.includes(i.id) ? 'is-checked' : ''}">
            <input type="checkbox" value="${i.id}" ${userInventory.includes(i.id) ? 'checked' : ''} onchange="toggleItem('${i.id}', this.checked, this)">
            <img src="${i.image}" class="img-square" onerror="this.src='https://via.placeholder.com/80?text=No+Icon'">
            <div class="item-card-content">
                <div class="item-id-info">no. ${i.id}</div>
                <div class="item-name-text">${i.name}</div>
            </div>
        </label>
    `).join('');
}

function toggleItem(id, isOwned, element) {
    if (isOwned) {
        if (!userInventory.includes(id)) userInventory.push(id);
        element.parentElement.classList.add('is-checked');
    } else {
        userInventory = userInventory.filter(item => item !== id);
        element.parentElement.classList.remove('is-checked');
    }
}

function saveInventory() {
    localStorage.setItem('inventory', JSON.stringify(userInventory));
    alert("Đã lưu " + userInventory.length + " món đồ vào trình duyệt!");
}

function applyArenaWeights() {
    // Logic tự động điền trọng số ải đã viết ở bản trước, bạn có thể bổ sung nếu cần
}

// Chạy khởi tạo
init();
