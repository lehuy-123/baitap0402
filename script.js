const API_URL = 'https://api.escuelajs.co/api/v1/products';
let allProducts = []; // Chứa toàn bộ dữ liệu từ API
let filteredProducts = []; // Chứa dữ liệu sau khi search/sort để hiển thị
let currentPage = 1;
let pageSize = 5;
let currentSort = { column: null, direction: 'asc' };

// Modal Instance
let productModal;

document.addEventListener('DOMContentLoaded', () => {
    productModal = new bootstrap.Modal(document.getElementById('productModal'));
    fetchProducts();

    // Event Listeners
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    document.getElementById('pageSizeSelect').addEventListener('change', handlePageSizeChange);
});

// 1. Fetch Data
async function fetchProducts() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        allProducts = data;
        filteredProducts = [...allProducts]; // Copy data
        renderTable();
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
        alert('Không thể tải dữ liệu sản phẩm.');
    }
}

// 2. Render Table & Pagination
function renderTable() {
    const tableBody = document.getElementById('productTableBody');
    tableBody.innerHTML = '';

    // Tính toán phân trang
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + parseInt(pageSize);
    const pageData = filteredProducts.slice(startIndex, endIndex);

    pageData.forEach(product => {
        // Xử lý ảnh (API đôi khi trả về chuỗi JSON lỗi cho ảnh)
        let imgUrl = 'https://via.placeholder.com/50';
        if (product.images && product.images.length > 0) {
            // Làm sạch chuỗi url nếu cần
            let cleanUrl = product.images[0].replace(/[\[\]"]/g, '');
            if(cleanUrl.startsWith('http')) imgUrl = cleanUrl;
        }

        const tr = document.createElement('tr');
        
        // Tooltip Description
        tr.setAttribute('data-bs-toggle', 'tooltip');
        tr.setAttribute('data-bs-placement', 'top');
        tr.setAttribute('title', product.description || 'No description');

        tr.innerHTML = `
            <td>${product.id}</td>
            <td>${product.title}</td>
            <td>$${product.price}</td>
            <td>${product.category ? product.category.name : 'N/A'}</td>
            <td><img src="${imgUrl}" class="product-img" alt="img"></td>
            <td>
                <button class="btn btn-sm btn-info text-white" onclick="viewDetail(${product.id})">
                    <i class="fa-solid fa-eye"></i> Xem/Sửa
                </button>
            </td>
        `;
        tableBody.appendChild(tr);
    });

    // Kích hoạt lại Tooltip của Bootstrap sau khi render
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    renderPagination();
}

function renderPagination() {
    const totalPages = Math.ceil(filteredProducts.length / pageSize);
    const paginationControls = document.getElementById('paginationControls');
    paginationControls.innerHTML = '';

    // Nút Previous
    let prevClass = currentPage === 1 ? 'disabled' : '';
    paginationControls.innerHTML += `
        <li class="page-item ${prevClass}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">Previous</a>
        </li>
    `;

    // Các trang (hiển thị đơn giản)
    // Để tránh quá dài, ở đây mình hiển thị max 5 trang gần nhất, bạn có thể custom thêm
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
        let activeClass = currentPage === i ? 'active' : '';
        paginationControls.innerHTML += `
            <li class="page-item ${activeClass}">
                <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
            </li>
        `;
    }

    // Nút Next
    let nextClass = currentPage === totalPages ? 'disabled' : '';
    paginationControls.innerHTML += `
        <li class="page-item ${nextClass}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">Next</a>
        </li>
    `;
}

function changePage(page) {
    const totalPages = Math.ceil(filteredProducts.length / pageSize);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderTable();
}

function handlePageSizeChange(e) {
    pageSize = parseInt(e.target.value);
    currentPage = 1;
    renderTable();
}

// 3. Search (Title)
function handleSearch(e) {
    const keyword = e.target.value.toLowerCase();
    filteredProducts = allProducts.filter(p => p.title.toLowerCase().includes(keyword));
    currentPage = 1;
    renderTable();
}

// 4. Sort (Price & Title)
function sortTable(column) {
    // Đảo ngược hướng nếu click cùng cột
    if (currentSort.column === column) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.column = column;
        currentSort.direction = 'asc';
    }

    filteredProducts.sort((a, b) => {
        let valA = a[column];
        let valB = b[column];

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return currentSort.direction === 'asc' ? -1 : 1;
        if (valA > valB) return currentSort.direction === 'asc' ? 1 : -1;
        return 0;
    });

    renderTable();
}

// 5. Export CSV
function exportToCSV() {
    // Lấy dữ liệu hiện tại (đã lọc/sort)
    if (filteredProducts.length === 0) {
        alert("Không có dữ liệu để xuất!");
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    // Header
    csvContent += "ID,Title,Price,Category,Description\n";

    // Rows
    filteredProducts.forEach(row => {
        // Xử lý dấu phẩy trong nội dung để không bị lỗi cột CSV
        let title = row.title.replace(/,/g, " ");
        let desc = (row.description || "").replace(/,/g, " ").replace(/\n/g, " ");
        let cat = row.category ? row.category.name : "";
        
        csvContent += `${row.id},${title},${row.price},${cat},${desc}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "products_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 6. View Detail & Edit Logic
function viewDetail(id) {
    const product = allProducts.find(p => p.id === id);
    if (!product) return;

    // Fill form
    document.getElementById('modalTitle').innerText = "Chi tiết / Cập nhật Sản phẩm";
    document.getElementById('productId').value = product.id;
    document.getElementById('productTitle').value = product.title;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productDesc').value = product.description;
    document.getElementById('productCategoryId').value = product.category ? product.category.id : 1;
    
    // Image handling
    let imgUrl = "";
    if(product.images && product.images.length > 0) {
        imgUrl = product.images[0].replace(/[\[\]"]/g, '');
    }
    document.getElementById('productImage').value = imgUrl;

    // Button state
    document.getElementById('btnSave').style.display = 'block'; // Show Edit Btn
    document.getElementById('btnCreate').style.display = 'none'; // Hide Create Btn

    productModal.show();
}

async function saveProduct() {
    const id = document.getElementById('productId').value;
    const title = document.getElementById('productTitle').value;
    const price = document.getElementById('productPrice').value;
    const description = document.getElementById('productDesc').value;

    const updateData = {
        title: title,
        price: parseInt(price),
        description: description
    };

    try {
        const res = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });

        if (res.ok) {
            alert('Cập nhật thành công!');
            productModal.hide();
            fetchProducts(); // Reload data
        } else {
            alert('Lỗi cập nhật!');
        }
    } catch (err) {
        console.error(err);
        alert('Có lỗi xảy ra.');
    }
}

// 7. Create Logic
function openCreateModal() {
    document.getElementById('modalTitle').innerText = "Tạo Sản phẩm Mới";
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = "Auto-generated";
    
    document.getElementById('btnSave').style.display = 'none'; // Hide Edit Btn
    document.getElementById('btnCreate').style.display = 'block'; // Show Create Btn

    productModal.show();
}

async function createProductAPI() {
    const title = document.getElementById('productTitle').value;
    const price = document.getElementById('productPrice').value;
    const description = document.getElementById('productDesc').value;
    const categoryId = document.getElementById('productCategoryId').value;
    const imageUrl = document.getElementById('productImage').value;

    // API yêu cầu images là mảng
    const newProduct = {
        title: title,
        price: parseInt(price),
        description: description,
        categoryId: parseInt(categoryId) || 1,
        images: [imageUrl || "https://placeimg.com/640/480/any"]
    };

    try {
        const res = await fetch(API_URL + '/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newProduct)
        });

        if (res.ok) {
            alert('Tạo mới thành công!');
            productModal.hide();
            fetchProducts();
        } else {
            const errData = await res.json();
            alert('Lỗi tạo mới: ' + JSON.stringify(errData));
        }
    } catch (err) {
        console.error(err);
        alert('Có lỗi kết nối.');
    }
}