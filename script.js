// Khởi tạo các mảng dữ liệu toàn cục
let ownedItems = []; 
let allClothesData = []; 

// =========================================================================
// 1. KHI TRANG WEB KHỞI ĐỘNG
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Tự động kiểm tra xem bộ nhớ trình duyệt đã lưu tủ đồ từ lần trước chưa
    const savedData = localStorage.getItem('nikki_owned_items');
    if (savedData) {
        ownedItems = JSON.parse(savedData);
        updateStatusText(`Đã nhận diện: ${ownedItems.length} món đồ của cậu!`, "#4caf50");
    }

    // Tiến hành fetch dữ liệu tổng từ file JSON của cậu
    loadWardrobeData();

    // Lắng nghe sự kiện người dùng chọn file cập nhật tủ đồ
    const fileInput = document.getElementById('file-upload');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
    }
});

// =========================================================================
// 2. BỘ LỌC THÔNG MINH - ĐỌC VÀ KHỬ KÝ TỰ LẠ CỦA FILE CLOTHES_DATE
// =========================================================================
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    updateStatusText("Đang dọn dẹp ký tự lạ và lọc ID...", "#ff9800");

    const reader = new FileReader();
    
    reader.onload = function(e) {
        const textContent = e.target.result;

        // Quét toàn bộ file và bốc ra các chuỗi số có độ dài từ 5 đến 8 chữ số (chuẩn ID của game)
        const foundIDs = textContent.match(/\b\d{5,8}\b/g);

        if (foundIDs && foundIDs.length > 0) {
            // Chuyển mảng chữ thành mảng Số, loại bỏ sạch ID trùng lặp, sắp xếp từ nhỏ đến lớn
            ownedItems = [...new Set(foundIDs.map(Number))].sort((a, b) => a - b);
            
            // Lưu ngay vào bộ nhớ LocalStorage của trình duyệt để lần sau vào không cần nạp lại file
            localStorage.setItem('nikki_owned_items', JSON.stringify(ownedItems));

            updateStatusText(`Thành công! Đã đồng bộ ${ownedItems.length} món đồ vào web.`, "#4caf50");

            // Vẽ lại giao diện tủ đồ để cập nhật ngay lập tức các món sáng / mờ
            renderWardrobe(allClothesData);
        } else {
            updateStatusText("Lỗi: File này không chứa dữ liệu ID đồ hợp lệ!", "#f44336");
        }
    };

    reader.readAsText(file, "UTF-8");
}

// Hàm cập nhật trạng thái chữ hiển thị cạnh nút bấm
function updateStatusText(text, color) {
    const statusSpan = document.getElementById('import-status');
    if (statusSpan) {
        statusSpan.innerText = text;
        statusSpan.style.color = color;
    }
}

// =========================================================================
// 3. TẢI DỮ LIỆU TỔNG TỪ SPREADSHEET / FILE JSON
// =========================================================================
async function loadWardrobeData() {
    try {
        // Cậu nhớ đặt tên file data tổng (chứa thuộc tính, ảnh) trùng với tên dưới này nhé
        const response = await fetch('clothes_data.json'); 
        allClothesData = await response.json();
        
        // Tạo giao diện hiển thị đồ lên màn hình
        renderWardrobe(allClothesData);
    } catch (error) {
        console.error("Lỗi khi tải dữ liệu tổng từ file JSON:", error);
        updateStatusText("Không tìm thấy file clothes_data.json tổng!", "#f44336");
    }
}

// =========================================================================
// 4. VẼ GIAO DIỆN TỦ ĐỒ (HIỂN THỊ ICON VUÔNG)
// =========================================================================
function renderWardrobe(dataList) {
    const gridContainer = document.getElementById('wardrobe-grid');
    if (!gridContainer) return;
    
    gridContainer.innerHTML = ''; // Dọn sạch lưới đồ cũ trước khi vẽ

    dataList.forEach(item => {
        // Tạo thẻ div bọc ngoài cho mỗi món đồ
        const itemCard = document.createElement('div');
        itemCard.className = 'item-card';
        itemCard.setAttribute('data-id', item.id);
        itemCard.setAttribute('data-category', item.category); // Đính kèm category để so sánh phối đồ

        // Tự động đối chiếu xem ID món này có nằm trong danh sách đồ cậu đã có hay không
        const isOwned = ownedItems.includes(Number(item.id));
        if (isOwned) {
            itemCard.classList.add('owned');     // Có đồ -> Hiện rõ ràng
        } else {
            itemCard.classList.add('not-owned'); // Chưa có -> Tự động làm mờ
        }

        // Đổ cấu trúc ảnh vuông (link từ spreadsheet của cậu) và thông tin ID/Tên đồ
        itemCard.innerHTML = `
            <div class="image-wrapper">
                <img src="${item.image_link}" alt="${item.name}" onerror="this.src='default-icon.png';">
            </div>
            <div class="item-info">
                <span class="item-id">${item.id}</span>
                <span class="item-name">${item.name}</span>
            </div>
        `;

        // Sự kiện click để chọn đồ mang đi so sánh tính điểm
        itemCard.addEventListener('click', () => {
            toggleSelectCard(itemCard, item);
        });

        gridContainer.appendChild(itemCard);
    });
}

// =========================================================================
// 5. LOGIC CHỌN ĐỒ VÀ ĐỐI CHIẾU CATEGORY (Tránh mất thuộc tính phụ kiện)
// =========================================================================
function toggleSelectCard(cardElement, itemData) {
    // Nếu món đồ này đang được chọn rồi -> Click vào là hủy chọn
    if (cardElement.classList.contains('selected')) {
        cardElement.classList.remove('selected');
        // (Cậu có thể viết thêm logic xóa món này khỏi bảng tính điểm phối đồ ở đây)
    } else {
        // Nếu chọn món mới -> Tự động gỡ bỏ món cũ ĐANG ĐƯỢC CHỌN cùng thuộc loại (category) đó ra
        removeSelectionByCategory(itemData.category);
        
        // Kích hoạt viền chọn cho món mới
        cardElement.classList.add('selected');
        // (Cậu viết thêm logic đẩy thông số món này vào bảng so sánh điểm ở đây)
    }
}

// Hàm quét và gỡ chọn món đồ cũ cùng loại (Ví dụ: Đổi từ Áo này sang Áo khác)
function removeSelectionByCategory(category) {
    // Chỉ quét những món đang có trạng thái được chọn (selected) trên màn hình
    const selectedCards = document.querySelectorAll('.item-card.selected');
    selectedCards.forEach(card => {
        const cardCategory = card.getAttribute('data-category');
        if (cardCategory === category) {
            card.classList.remove('selected');
        }
    });
}
