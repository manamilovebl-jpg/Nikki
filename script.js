const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQvuIgcVvxltqjqcALb8tpaG-pmhY7VmV9G7AB0STX4964cPnLbG9Vfirr5N2fVoEEAkjCepvqxFtvg/pub?output=csv';

let clothingData = [];
let userInventory = [];
const scoreMap = { 'SS': 5000, 'S': 4000, 'A': 3000, 'B': 2000, 'C': 1000, '': 0 };

async function init() {
    try {
        const response = await fetch(SHEET_URL);
        const data = await response.text();
        const rows = data.split('\n').slice(1);

        // Reset kho đồ để cập nhật hoàn toàn theo cột Owned (Cột D)
        userInventory = []; 

        clothingData = rows.map(row => {
            const c = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); 
            if (c.length < 5) return null;

            const itemId = c[0]?.trim();
            // Cột D là Owned (index 3)
            const isOwnedInSheet = c[3]?.trim().toUpperCase() === 'TRUE';

            if (isOwnedInSheet && itemId) {
                userInventory.push(itemId);
            }

            return {
                id: itemId,
                image: c[1]?.trim() || 'https://via.placeholder.com/45',
                name: c[2]?.trim().replace(/"/g, ""),
                type: c[4]?.trim().toLowerCase(),
                stats: {
                    gorgeous: scoreMap[c[6]?.trim()] || 0,
                    simple: scoreMap[c[7]?.trim()] || 0,
                    elegance: scoreMap[c[8]?.trim()] || 0,
                    lively: scoreMap[c[9]?.trim()] || 0,
                    mature: scoreMap[c[10]?.trim()] || 0,
                    cute: scoreMap[c[11]?.trim()] || 0,
                    sexy: scoreMap[c[12]?.trim()] || 0,
                    pure: scoreMap[c[13]?.trim()] || 0,
                    warm: scoreMap[c[14]?.trim()] || 0,
                    cool: scoreMap[c[15]?.trim()] || 0
                }
            };
        }).filter(i => i && i.id);

        localStorage.setItem('my_nikki_items', JSON.stringify(userInventory));

        // Gọi các hàm hiển thị
        renderTabs();
        if (clothingData.length > 0) {
            showCategory(clothingData[0].type);
        }
    } catch (e) { 
        console.error("Lỗi tải dữ liệu:", e); 
    }
}

// HÀM TẠO CÁC NÚT LOẠI ĐỒ (Dòng này bị thiếu trong code cũ của bạn)
function renderTabs() {
    const cats = [...new Set(clothingData.map(i => i.type))];
    const container = document.getElementById('category-tabs');
    if (container) {
        container.innerHTML = cats.map(cat => 
            `<button class="tab-btn" onclick="showCategory('${cat}')">${cat.toUpperCase()}</button>`
        ).join('');
    }
}

// HÀM HIỂN THỊ DANH SÁCH ĐỒ
function showCategory(type) {
    const list = document.getElementById('item-lists');
    if (!list) return;

    const items = clothingData.filter(i => i.type === type);
    
    document.querySelectorAll('.tab-btn').forEach(b => 
        b.classList.toggle('active', b.innerText.toLowerCase() === type.toLowerCase())
    );

    list.innerHTML = items.map(item => `
        <label class="item-checkbox">
            <input type="checkbox" value="${item.id}" ${userInventory.includes(item.id) ? 'checked' : ''} onchange="updateItem('${item.id}', this.checked)">
            <img src="${item.image}" class="item-thumb" onerror="this.src='https://via.placeholder.com/45'">
            <div class="item-info"><b>${item.name}</b><br><small>${item.id}</small></div>
        </label>
    `).join('');
}

function updateItem(id, check) {
    if (check) { if (!userInventory.includes(id)) userInventory.push(id); }
    else { userInventory = userInventory.filter(i => i !== id); }
}

function saveInventory() {
    localStorage.setItem('my_nikki_items', JSON.stringify(userInventory));
    alert("Đã lưu kho đồ!");
}

function suggestBestOutfit() {
    const w = {
        simple: parseFloat(document.getElementById('w-simple').value) || 0,
        pure: parseFloat(document.getElementById('w-pure').value) || 0,
        elegance: parseFloat(document.getElementById('w-elegance').value) || 0,
        cool: parseFloat(document.getElementById('w-cool').value) || 0,
        mature: parseFloat(document.getElementById('w-mature').value) || 0
    };

    const myItems = clothingData.filter(i => userInventory.includes(i.id));
    const types = [...new Set(clothingData.map(i => i.type))];
    const resList = document.getElementById('suggestion-list');
    resList.innerHTML = "";

    types.forEach(type => {
        let best = null, max = -1;
        myItems.filter(i => i.type === type).forEach(item => {
            let score = 0;
            for (let s in w) { score += (item.stats[s] || 0) * w[s]; }
            if (score > max) { max = score; best = item; }
        });

        if (best) {
            resList.innerHTML += `<li>
                <img src="${best.image}" class="item-thumb">
                <div><b>${type.toUpperCase()}:</b> ${best.name} <br><small>Điểm: ${Math.round(max)}</small></div>
            </li>`;
        }
    });
    document.getElementById('result-box').style.display = (resList.innerHTML) ? 'block' : 'none';
}

// Chạy khởi tạo
init();
