const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQvuIgcVvxltqjqcALb8tpaG-pmhY7VmV9G7AB0STX4964cPnLbG9Vfirr5N2fVoEEAkjCepvqxFtvg/pub?output=csv';
let clothingData = [], userInventory = [];
const scoreMap = { 'SS': 5000, 'S': 4000, 'A': 3000, 'B': 2000, 'C': 1000, '': 0 };
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
            if (c[3]?.trim().toUpperCase() === 'TRUE') userInventory.push(itemId);
            return {
                id: itemId, image: c[1]?.trim() || 'https://via.placeholder.com/45', name: c[2]?.trim().replace(/"/g, ""),
                type: c[4]?.trim().toLowerCase(), tags: [c[16]?.trim(), c[17]?.trim()].filter(t => t),
                stats: { gorgeous: scoreMap[c[6]?.trim()], simple: scoreMap[c[7]?.trim()], elegance: scoreMap[c[8]?.trim()], lively: scoreMap[c[9]?.trim()], mature: scoreMap[c[10]?.trim()], cute: scoreMap[c[11]?.trim()], sexy: scoreMap[c[12]?.trim()], pure: scoreMap[c[13]?.trim()], warm: scoreMap[c[14]?.trim()], cool: scoreMap[c[15]?.trim()] }
            };
        }).filter(i => i && i.id);
        renderTabs();
        showCategory(clothingData[0]?.type);
    } catch (e) { console.error(e); }
}

function renderTabs() {
    const cats = [...new Set(clothingData.map(i => i.type))];
    document.getElementById('category-tabs').innerHTML = cats.map(cat => `<button class="tab-btn" onclick="showCategory('${cat}')">${cat.toUpperCase()}</button>`).join('');
    const allTags = []; clothingData.forEach(item => item.tags.forEach(t => allTags.push(t)));
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
    const w = { gorgeous: parseFloat(document.getElementById('w-gorgeous').value), simple: parseFloat(document.getElementById('w-simple').value), pure: parseFloat(document.getElementById('w-pure').value), sexy: parseFloat(document.getElementById('w-sexy').value), elegance: parseFloat(document.getElementById('w-elegance').value), lively: parseFloat(document.getElementById('w-lively').value), warm: parseFloat(document.getElementById('w-warm').value), cool: parseFloat(document.getElementById('w-cool').value), cute: parseFloat(document.getElementById('w-cute').value), mature: parseFloat(document.getElementById('w-mature').value) };
    const myItems = clothingData.filter(i => userInventory.includes(i.id));
    const types = [...new Set(clothingData.map(i => i.type))];
    let total = 0; let html = "";
    types.forEach(t => {
        let best = null, max = -1;
        myItems.filter(i => i.type === t).forEach(item => {
            let s = 0; for (let k in w) s += (item.stats[k] || 0) * w[k];
            if (stag && item.tags.includes(stag)) s *= 2;
            if (s > max) { max = s; best = item; }
        });
        if (best) {
            total += max;
            html += `<li><img src="${best.image}" class="item-thumb"><div><b>${t.toUpperCase()}:</b> ${best.name} ${stag && best.tags.includes(stag) ? '<span style="color:red;">[Tag]</span>' : ''}<br><small>Điểm: ${Math.round(max).toLocaleString()}</small></div></li>`;
        }
    });
    document.getElementById('total-score-val').innerText = Math.round(total).toLocaleString();
    document.getElementById('suggestion-list').innerHTML = html;
    document.getElementById('result-box').style.display = total > 0 ? 'block' : 'none';
}

function updateItem(id, c) { if(c) { if(!userInventory.includes(id)) userInventory.push(id); } else userInventory = userInventory.filter(i => i !== id); }
function saveInventory() { localStorage.setItem('my_nikki_items', JSON.stringify(userInventory)); alert("Đã lưu!"); }
init();
