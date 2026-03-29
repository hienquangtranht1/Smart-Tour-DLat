/* =========================================================
   user.js – Smart Tour Đà Lạt – Khách Du Lịch
   ========================================================= */

// ── 1. TOAST NOTIFICATION ─────────────────────────────────
function showToast(msg, isError = false) {
    const t = document.createElement('div');
    t.style.cssText = `
        position:fixed;bottom:20px;right:20px;z-index:9999;
        padding:0.9rem 1.5rem;border-radius:12px;color:#fff;font-size:.875rem;
        font-weight:600;display:flex;align-items:center;gap:.5rem;min-width:260px;
        background:${isError ? 'linear-gradient(135deg,#f43f5e,#fb7185)' : 'linear-gradient(135deg,#10b981,#34d399)'};
        box-shadow:0 10px 30px rgba(0,0,0,.4);animation:slideUp .35s ease;
    `;
    t.innerHTML = `<i class="fas fa-${isError ? 'circle-xmark' : 'circle-check'}"></i> ${msg}`;
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .5s'; setTimeout(() => t.remove(), 500); }, 3200);
}

// ── 2. SIDEBAR TAB SWITCHING ──────────────────────────────
function initTabs() {
    document.querySelectorAll('.nav-link[data-target]').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const target = link.getAttribute('data-target');
            document.querySelectorAll('.nav-link[data-target]').forEach(l => l.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
            link.classList.add('active');
            const el = document.getElementById(target);
            if (el) { el.style.display = 'block'; }
            if (target === 'booking') fetchServices();
            if (target === 'billing') fetchMyOrders();
            if (target === 'map') setTimeout(initUserMap, 150);
        });
    });
}

// ── 3. OSM MAP (LEAFLET) ─────────────────────────────────
let userMap;
let userLocation = null; // Fix lỗi ReferenceError khi chưa xin quyền định vị
function initUserMap() {
    if (userMap) { userMap.invalidateSize(); return; }
    userMap = L.map('osm-map').setView([11.9404, 108.4583], 13);
    L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=vi&gl=VN', {
        attribution: 'Bản đồ Du lịch Đà Lạt © Smart Tour System'
    }).addTo(userMap);

    // Điểm mặc định nổi tiếng tại Đà Lạt
    const spots = [
        { lat: 11.9404, lng: 108.4583, name: 'Trung tâm Đà Lạt – Hồ Xuân Hương' },
        { lat: 11.9288, lng: 108.5358, name: 'Trại Mát / Cầu Đất Farm' },
        { lat: 11.8841, lng: 108.4030, name: 'God Valley – Thung lũng Tình Yêu' },
        { lat: 11.9618, lng: 108.4273, name: 'Làng Cù Lần – Langbiang' },
        { lat: 12.0023, lng: 108.4600, name: 'Đỉnh Langbiang 2167m' },
    ];
    spots.forEach(s => L.marker([s.lat, s.lng]).addTo(userMap).bindPopup(`<b>${s.name}</b>`));
}

// ── 4. AI LỊCH TRÌNH ─────────────────────────────────────
async function handleAIGenerate(e) {
    e.preventDefault();
    const btn = document.getElementById('btnAIGenerate');
    const orig = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> AI đang phân tích...';
    btn.disabled = true;

    const body = new URLSearchParams({
        budget:        document.getElementById('aiBudget').value,
        arrival:       document.getElementById('aiArrival').value,
        departure:     document.getElementById('aiDeparture').value,
        groupType:     document.getElementById('aiGroup').value,
        startLocation: document.getElementById('aiStartLoc').value,
        pace:          document.getElementById('aiPace').value,
        transport:     document.getElementById('aiTransport').value,
        preferences:   document.getElementById('aiPrefs').value
    });

    try {
        const res = await fetch('/api/user/ai/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body
        });
        const data = await res.json();
        
        if (res.ok) {
            showToast(data.message);
            renderItinerary(data.itinerary);
            document.getElementById('ai-result').style.display = 'block';
            window.scrollTo({ top: document.getElementById('ai-result').offsetTop - 30, behavior: 'smooth' });
        } else {
            showToast(data.error || 'Lỗi Server AI. Vui lòng thử lại!', true);
        }
    } catch {
        showToast('Không kết nối được máy chủ AI!', true);
    } finally {
        btn.innerHTML = orig;
        btn.disabled = false;
    }
}

function renderItinerary(days) {
    const c = document.getElementById('ai-itinerary-content');
    c.innerHTML = '';
    days.forEach(d => {
        const parseCard = (timeTxt, objClass, data) => {
            if (!data || !data.location || data.location.trim() === '') return '';
            return `<li>
                <span class="time-badge ${objClass}">${timeTxt}</span> 
                <b>${data.location}</b> <br>
                <small class="text-muted" style="margin-left:55px;display:block">📝 ${data.note || ''} | 💸 Chi phí: ${data.cost || '0'}</small>
            </li>`;
        };
        
        c.innerHTML += `
        <div class="ai-day-card">
            <h4 class="ai-day-title">${d.day || d.title || 'Lịch trình ngày'}</h4>
            <ul class="ai-day-list">
                ${parseCard('🌅 Sáng', 'morning', d.morning)}
                ${parseCard('☀️ Trưa', 'noon', d.noon)}
                ${parseCard('🌙 Tối', 'evening', d.evening)}
            </ul>
        </div>`;
    });
}

function exportItineraryPDF() {
    const element = document.getElementById('ai-result');
    if (!element) return;

    showToast('🖨️ Đang xuất file PDF Lịch Trình...');

    // Thêm watermark tạm thời
    const watermark = document.createElement('div');
    watermark.id = '_pdf_header';
    watermark.style.cssText = 'text-align:center;padding:10px 0 20px;border-bottom:2px solid #6366f1;margin-bottom:16px';
    watermark.innerHTML = `
        <h2 style="color:#6366f1;font-size:1.4rem;margin:0">🌄 Smart Tour Đà Lạt</h2>
        <p style="color:#64748b;font-size:0.8rem;margin:4px 0 0">Lịch trình AI tạo ngày ${new Date().toLocaleDateString('vi-VN')}</p>
    `;
    const content = document.getElementById('ai-itinerary-content');
    element.insertBefore(watermark, content);

    const opt = {
        margin:       [10, 12, 10, 12],
        filename:     'SmartTour_Lichtrình_DaLat.pdf',
        image:        { type: 'jpeg', quality: 0.95 },
        html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#0f172a' },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
        // Xoá watermark sau khi xuất xong
        const wm = document.getElementById('_pdf_header');
        if (wm) wm.remove();
        showToast('✅ Đã lưu PDF lịch trình thành công!');
    });
}


function requestUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                userLocation = L.latLng(pos.coords.latitude, pos.coords.longitude);
                showToast("Đã cập nhật vị trí thẻ định vị!");
                if (window._servicesData) applyFilters();
            },
            () => showToast("Bạn đã từ chối hoặc máy không hỗ trợ chia sẻ Định Vị.", true)
        );
    } else {
        showToast("Trình duyệt không hỗ trợ định vị.", true);
    }
}

async function fetchServices() {
    const grid = document.getElementById('servicesGrid');
    if (!grid) return;
    grid.innerHTML = '<div class="loading-msg"><i class="fas fa-spinner fa-spin"></i> Đang tải dịch vụ...</div>';

    try {
        const res = await fetch('/api/user/services');
        if (!res.ok) { if (res.status === 401 || res.status === 403) location.href = 'index.html'; return; }
        
        const data = await res.json();
        window._servicesData = data;
        applyFilters();
    } catch (e) {
        console.error("Loi:", e);
        grid.innerHTML = '<div class="empty-msg">Lỗi tải dữ liệu: ' + (e.message || 'Không kết nối được máy chủ.') + '</div>';
    }
}

function triggerHeroSearch() {
    const kw = document.getElementById('heroSearchKw')?.value || '';
    const cat = document.getElementById('heroSearchCat')?.value || '';
    
    if (document.getElementById('filterKeyword')) document.getElementById('filterKeyword').value = kw;
    if (document.getElementById('filterCategory')) document.getElementById('filterCategory').value = cat;
    
    const navLink = document.querySelector('.nav-link[data-target="booking"]');
    if (navLink) navLink.click();
    
    applyFilters();
}

function isCurrentlyOpen(s) {
    if (!s.openingTime || !s.closingTime) return true;
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    
    const [oH, oM] = s.openingTime.split(':').map(Number);
    const openMins = oH * 60 + (oM || 0);
    
    const [cH, cM] = s.closingTime.split(':').map(Number);
    let closeMins = cH * 60 + (cM || 0);
    
    if (closeMins > openMins) return currentMins >= openMins && currentMins <= closeMins;
    return currentMins >= openMins || currentMins <= closeMins; // xuyên đêm
}

function applyFilters() {
    if (!window._servicesData) return;
    
    const kw = (document.getElementById('filterKeyword')?.value || '').toLowerCase();
    const cat = document.getElementById('filterCategory')?.value || '';
    const openNow = document.getElementById('filterOpenNow')?.checked || false;
    const nearMe = document.getElementById('filterNearMe')?.checked || false;
    
    let result = window._servicesData;
    
    // Lọc theo ký tự
    if (kw) {
        result = result.filter(s => 
            (s.name || '').toLowerCase().includes(kw) || 
            (s.description || '').toLowerCase().includes(kw) ||
            (s.agencyName || '').toLowerCase().includes(kw)
        );
    }
    
    // Lọc theo Danh mục
    if (cat) result = result.filter(s => s.type === cat);
    
    // Lọc theo trạng thái Đang mở cửa
    if (openNow) result = result.filter(s => isCurrentlyOpen(s));
    
    // Lọc theo Vị trí quanh đây 5km
    if (nearMe) {
        if (!userLocation) {
            showToast("Vui lòng Bật 'Định vị GPS' của bạn ở góc trên trước khi lọc quanh đây!", true);
            document.getElementById('filterNearMe').checked = false;
        } else {
            result = result.filter(s => {
                if (!s.mapPoints) return false;
                const firstPointStr = s.mapPoints.split('|').filter(x=>x)[0];
                if (!firstPointStr) return false;
                const ll = firstPointStr.split(';')[0].split(',');
                if (ll.length < 2) return false;
                const dest = L.latLng(parseFloat(ll[0]), parseFloat(ll[1]));
                return userLocation.distanceTo(dest) <= 5000;
            });
        }
    }
    
    renderServicesGrid(result);
}

function renderServicesGrid(data) {
    const grid = document.getElementById('servicesGrid');
    grid.innerHTML = '';
    if (data.length === 0) {
        grid.innerHTML = '<div class="empty-msg">Hệ thống chưa có dịch vụ nào được mở bán!</div>';
        return;
    }
    
    data.forEach(s => {
        let distanceHtml = '';
        if (userLocation && s.mapPoints) {
            const firstPointStr = s.mapPoints.split('|').filter(x=>x)[0];
            if (firstPointStr) {
                const ll = firstPointStr.split(';')[0].split(',');
                if (ll.length >= 2) {
                    const dest = L.latLng(parseFloat(ll[0]), parseFloat(ll[1]));
                    const dist = userLocation.distanceTo(dest);
                    const distText = dist > 1000 ? (dist/1000).toFixed(1) + ' km' : Math.round(dist) + ' m';
                    distanceHtml = `<div style="position:absolute;top:10px;left:10px;background:rgba(16,185,129,0.9);color:white;padding:4px 8px;border-radius:8px;font-size:0.75rem;font-weight:bold;backdrop-filter:blur(4px);box-shadow:0 2px 4px rgba(0,0,0,0.3);z-index:2;border:1px solid rgba(255,255,255,0.2)"><i class="fas fa-location-crosshairs"></i> Cách bạn ${distText}</div>`;
                }
            }
        }

        const price = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(s.price);
        const tagColor = s.type === 'HOTEL'
            ? 'background:rgba(52,211,153,.2);color:#34d399;'
            : 'background:rgba(129,140,248,.2);color:#818cf8;';
        const safeUrl = (s.imageUrl && (s.imageUrl.startsWith('http') || s.imageUrl.startsWith('/'))) ? s.imageUrl : `https://picsum.photos/seed/${s.id}/400/300`;
        const imgHtml = s.imageUrl 
            ? `<img src="${safeUrl}" class="service-img" onerror="this.onerror=null; this.src='https://picsum.photos/seed/${s.id}/400/300';" style="object-fit: cover; width: 100%; height: 200px; border-radius: 12px 12px 0 0;" alt="${s.name}">`
            : `<div class="service-img" style="display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,rgba(99,102,241,.15),rgba(52,211,153,.1));border-radius:12px 12px 0 0; height: 200px;"><i class="fas fa-image" style="font-size:3rem;color:rgba(129,140,248,.5)"></i></div>`;
        grid.innerHTML += `
        <div class="service-card glass-panel" style="position:relative">
            ${distanceHtml}
            ${imgHtml}
            <div class="service-info">
                <div class="service-header">
                    <h3>${s.name}</h3>
                    <span class="type-badge" style="${tagColor}">${s.type}</span>
                </div>
                <p class="service-agency"><i class="fas fa-store"></i> ${s.agencyName}</p>
                <p class="service-desc">${s.description.substring(0,80)}...</p>
                <div class="service-footer">
                    <span class="price-tag">${price}</span>
                    <button class="btn btn-primary btn-sm" onclick="showServiceDetail(${s.id})">
                        <i class="fas fa-info-circle"></i> Xem Chi Tiết
                    </button>
                </div>
            </div>
        </div>`;
    });
}

// ── DANH SÁCH ĐƠN HÀNG CỦA TÔI ─────────────────────
async function fetchMyOrders() {
    console.log("fetchMyOrders invoked...");
    const list = document.getElementById('myOrdersList');
    if (!list) return;
    
    // Đổi chữ loading để dễ nhận dạng file đã được cập nhật chưa
    list.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;color:#64748b"><i class="fas fa-spinner fa-spin"></i> Đang lấy dữ liệu đơn hàng từ máy chủ...</td></tr>';
    
    try {
        const res = await fetch('/api/user/orders');
        console.log("Fetch user orders status:", res.status);
        if (!res.ok) { 
            list.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2rem;color:#f43f5e"><i class="fas fa-exclamation-circle"></i> Máy chủ báo lỗi ${res.status}! Vui lòng thử lại.</td></tr>`; 
            return; 
        }
        const orders = await res.json();
        console.log("Orders received:", orders.length);
        renderMyOrders(orders);
    } catch (e) {
        console.error("fetchMyOrders error:", e);
        list.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;color:#f43f5e"><i class="fas fa-wifi-slash"></i> Không kết nối được Backend! Mở F12 xem chi tiết.</td></tr>';
    }
}

function renderMyOrders(orders) {
    const list = document.getElementById('myOrdersList');
    const fmt = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

    const total = orders.length;
    const paid = orders.filter(o => ['PAID','IN_PROGRESS','COMPLETED'].includes(o.status)).length;
    const pending = orders.filter(o => ['PENDING','AWAITING_PAYMENT'].includes(o.status)).length;
    const statTotal = document.getElementById('statTotalOrders');
    const statPaid = document.getElementById('statTotalPaid');
    const statPend = document.getElementById('statPending');
    if (statTotal) statTotal.textContent = `${total} đơn`;
    if (statPaid) statPaid.textContent = `${paid} đơn`;
    if (statPend) statPend.textContent = `${pending} đơn`;

    // FIX CHÍNH: Render bảng rỗng đúng chuẩn HTML
    if (orders.length === 0) {
        list.innerHTML = `<tr><td colspan="5">
            <div style="text-align:center;padding:3rem;color:#94a3b8">
                <i class="fas fa-shopping-bag" style="font-size:3rem;display:block;margin-bottom:1rem;opacity:.4"></i>
                Bạn chưa có đơn hàng nào. Hãy khám phá dịch vụ!
            </div>
        </td></tr>`;
        return;
    }

    const statusMap = {
        PENDING:         { label: '⏳ Chờ Đại Lý Duyệt',  color: '#f59e0b', bg: 'rgba(245,158,11,.12)' },
        AWAITING_PAYMENT:{ label: '💳 Chờ Thanh Toán',    color: '#f43f5e', bg: 'rgba(244,63,94,.12)'  },
        PAID:            { label: '✅ Đã Thanh Toán',      color: '#10b981', bg: 'rgba(16,185,129,.12)' },
        IN_PROGRESS:     { label: '🚀 Đang Tiến Hành',    color: '#6366f1', bg: 'rgba(99,102,241,.12)' },
        COMPLETED:       { label: '🏁 Đã Hoàn Thành',     color: '#64748b', bg: 'rgba(100,116,139,.12)' },
        CANCELLED:       { label: '❌ Đã Hủy',            color: '#ef4444', bg: 'rgba(239,68,68,.12)'  },
    };

    list.innerHTML = orders.map(o => {
        const st = statusMap[o.status] || { label: o.status, color: '#94a3b8', bg: '#f1f5f9' };
        const badge = `<span style="background:${st.bg};color:${st.color};font-size:.7rem;font-weight:700;padding:4px 10px;border-radius:20px;display:inline-block">${st.label}</span>`;
        const oEncoded = encodeURIComponent(JSON.stringify(o));
        
        const btnDetail = `<button class="btn btn-primary btn-xs" onclick="showUserOrderDetail('${oEncoded}')" style="background:#6366f1;border:none;padding:4px 8px;font-size:0.7rem"><i class="fas fa-eye"></i> Chi tiết</button>`;
        const btnPay = o.status === 'AWAITING_PAYMENT' 
            ? `<button class="btn btn-success btn-xs" onclick="payVnpay(${o.id}, ${o.totalAmount})" style="background:#10b981;border:none;padding:4px 8px;font-size:0.7rem;margin-left:4px"><i class="fas fa-credit-card"></i> Pay</button>` 
            : '';

        return `
        <tr style="border-bottom:1px solid #f1f5f9">
            <td style="padding:12px 15px; font-weight:700; color:#4f46e5; font-size:0.85rem">#${String(o.id).padStart(5,'0')}</td>
            <td style="padding:12px 15px">
                <div style="font-weight:600; color:#1e293b; font-size:0.85rem">${o.services || '—'}</div>
                <div style="font-size:0.7rem; color:#94a3b8"><i class="far fa-calendar-alt"></i> ${o.bookingDate || '—'} | <i class="far fa-clock"></i> ${o.bookingTime || '—'}</div>
            </td>
            <td style="padding:12px 15px; font-weight:700; color:#f43f5e; font-size:0.85rem">${fmt(o.totalAmount)}</td>
            <td style="padding:12px 15px; text-align:center">${badge}</td>
            <td style="padding:12px 15px; text-align:right">
                <div style="display:flex; justify-content:flex-end; gap:4px">
                    ${btnDetail}
                    ${btnPay}
                </div>
            </td>
        </tr>
        `;
    }).join('');
}

function showUserOrderDetail(encodedData) {
    const o = JSON.parse(decodeURIComponent(encodedData));
    const fmt = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);
    const statusLabels = {
        PENDING: '⌛ Đang chờ Đại lý Duyệt',
        AWAITING_PAYMENT: '💳 Đã Duyệt - Chờ Thanh Toán',
        PAID: '✅ Đã Thanh Toán',
        IN_PROGRESS: '🚀 Đang Diễn Ra',
        COMPLETED: '🏁 Đã Kết Thúc',
        CANCELLED: '❌ Đã Hủy'
    };

    const rows = [
        ['📦 Dịch vụ', o.services || o.serviceName || '—'],
        ['🏷️ Loại hình', o.serviceType || '—'],
        ['📅 Ngày đến', o.bookingDate || '—'],
        ['⏰ Giờ đến', o.bookingTime ? `<b>${o.bookingTime}</b>` : '—'],
        ['🏁 Ngày kết thúc', o.endDate || '—'],
[o.serviceType === 'HOTEL' ? '🌙 Thời gian thuê' : '🌙 Thời lượng', o.bookingDays ? `<b>${o.bookingDays}</b> ${o.serviceType === 'HOTEL' ? 'đêm' : 'ngày'}` : '—'],        ['👥 Số lượng đặt', o.quantity ? `<b>${o.quantity}</b> ${o.serviceType === 'HOTEL' ? 'phòng' : 'người'}` : '—'],
        ['📅 Ngày tạo đơn', o.orderDate || '—'],
        ['💰 Tổng thanh toán', `<span style="color:#f43f5e;font-weight:bold;font-size:1.1rem">${fmt(o.totalAmount)}</span>`],
        ['📋 Trạng thái', `<span style="font-weight:700">${statusLabels[o.status] || o.status}</span>`],
    ];

    const existing = document.getElementById('_userOrderDetailModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = '_userOrderDetailModal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:1rem;backdrop-filter:blur(4px)';
    modal.innerHTML = `
    <div style="background:#fff;border-radius:20px;padding:2.2rem;width:100%;max-width:450px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);position:relative">
        <button onclick="document.getElementById('_userOrderDetailModal').remove()" style="position:absolute;top:15px;right:18px;background:none;border:none;font-size:1.5rem;cursor:pointer;color:#94a3b8">×</button>
        <h3 style="margin-bottom:1.8rem;font-size:1.2rem;color:#1e293b;display:flex;align-items:center;gap:10px">
            <i class="fas fa-file-invoice" style="color:#6366f1"></i> Chi Tiết Đơn Hàng #${String(o.id).padStart(5,'0')}
        </h3>
        <div style="border:1px solid #f1f5f9;border-radius:12px;overflow:hidden">
            <table style="width:100%;border-collapse:collapse">
                ${rows.map(([label, val], idx) => `
                <tr style="background:${idx % 2 === 0 ? '#fff' : '#f8fafc'}">
                    <td style="padding:12px 15px;font-size:.85rem;color:#64748b;width:40%">${label}</td>
                    <td style="padding:12px 15px;font-size:.88rem;color:#1e293b;text-align:right">${val}</td>
                </tr>`).join('')}
            </table>
        </div>
        <div style="margin-top:2rem;display:flex;gap:.8rem">
            <button onclick="document.getElementById('_userOrderDetailModal').remove()" style="flex:1;padding:10px;border:1.5px solid #e2e8f0;border-radius:10px;background:#fff;cursor:pointer;font-weight:700;color:#64748b">Quay lại</button>
            ${o.status === 'AWAITING_PAYMENT' ? `<button onclick="payVnpay(${o.id}, ${o.totalAmount})" style="flex:1.5;padding:10px;border:none;border-radius:10px;background:#6366f1;color:#fff;cursor:pointer;font-weight:700"><i class="fas fa-credit-card"></i> Thanh toán ngay</button>` : ''}
        </div>
    </div>`;
    document.body.appendChild(modal);
}

async function payVnpay(orderId, amount) {
    try {
        showToast('Đang kết nối cổng VNPAY an toàn...');
        const res = await fetch(`/api/payment/create-payment?orderId=${orderId}&amount=${amount}`, { method: 'POST' });
        const data = await res.json();
        if (data.paymentUrl) {
            window.location.href = data.paymentUrl;
        } else {
            showToast("Lỗi khởi tạo thanh toán VNPAY!", true);
        }
    } catch (e) {
        console.error("VNPAY error:", e);
        showToast("Không thể kết nối dịch vụ thanh toán!", true);
    }
}

async function bookService(id, btn) {

    const s = (window._servicesData || []).find(x => x.id === id);
    if (!s) return;

    // Hiển thị modal chọn lịch đặt dịch vụ
    const bookingResult = await showBookingModal(s);
    if (!bookingResult) return; // user bấm hủy

    const { quantity, bookingDays, bookingDate, bookingTime, numberOfPeople } = bookingResult;

    const orig = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    btn.disabled = true;
    try {
        let url = `/api/user/book/${id}?quantity=${quantity}&bookingDays=${bookingDays}&bookingDate=${bookingDate}`;
        if (bookingTime) url += `&bookingTime=${bookingTime}`;
        if (numberOfPeople) url += `&numberOfPeople=${numberOfPeople}`;
        const res = await fetch(url, { method: 'POST' });
        const json = await res.json();
        if (res.ok) {
            showToast('🎉 ' + (json.message || 'Đặt dịch vụ thành công! Chờ Đại lý duyệt.'));
            btn.innerHTML = '<i class="fas fa-check"></i> Đã Đặt';
            btn.style.background = '#10b981';
        } else {
            showToast(json.error || 'Không thể đặt dịch vụ!', true);
            btn.innerHTML = orig; btn.disabled = false;
        }
    } catch {
        showToast('Lỗi kết nối!', true);
        btn.innerHTML = orig; btn.disabled = false;
    }
}

function showBookingModal(s) {
    return new Promise((resolve) => {
        // Xóa modal cũ nếu có
        const old = document.getElementById('booking-date-modal');
        if (old) old.remove();

        const today = new Date().toISOString().split('T')[0];
        const isTour = s.type === 'TOUR';
        const isHotel = s.type === 'HOTEL';
        const hasTime = !isTour; // Hotel, Cafe, Restaurant cần chọn giờ

        const durationNote = isTour && s.durationDays
            ? `<div style="margin-top:.5rem;font-size:.82rem;color:#64748b"><i class="fas fa-info-circle"></i> Tour này kéo dài <b>${s.durationDays} ngày</b>. Ngày kết thúc sẽ tự tính sau khi bạn chọn ngày khởi hành.</div>`
            : '';
        const timeHtml = hasTime ? `
            <div style="margin-top:1rem">
                <label style="font-size:.85rem;font-weight:600;color:#374151;display:block;margin-bottom:.4rem">
                    <i class="fas fa-clock"></i> Giờ đến ${s.openingTime ? `<span style="color:#64748b;font-weight:400">(Khung giờ: ${s.openingTime} – ${s.closingTime})</span>` : ''}
                </label>
                <input type="time" id="bookTime" min="${s.openingTime || '00:00'}" max="${s.closingTime || '23:59'}"
                    style="width:100%;padding:.55rem .75rem;border:1.5px solid #d1d5db;border-radius:8px;font-size:.95rem;outline:none"
                    value="${s.openingTime || '08:00'}" required>
            </div>` : '';
        const quantityLabel = isHotel ? `Số phòng (còn ${s.availableRooms || 0} phòng)` : (isTour ? `Số lượng vé (tối đa ${s.maxPeople || '?'})` : 'Số lượng');
        
        // Ô nhập số người đi (Chỉ hiện cho Khách sạn / Ăn uống)
        const peopleHtml = !isTour ? `
            <div style="margin-top:1rem">
                <label style="font-size:.85rem;font-weight:600;color:#374151;display:block;margin-bottom:.4rem"><i class="fas fa-users"></i> Số người đi (Sức chứa tối đa: ${s.maxPeople || '?'}/đơn vị)</label>
                <input type="number" id="bookPeople" min="1" value="1"
                    style="width:100%;padding:.55rem .75rem;border:1.5px solid #d1d5db;border-radius:8px;font-size:.95rem">
            </div>` : '';

        const daysHtml = isHotel ? `
            <div style="margin-top:1rem">
                <label style="font-size:.85rem;font-weight:600;color:#374151;display:block;margin-bottom:.4rem"><i class="fas fa-moon"></i> Số đêm thuê</label>
                <input type="number" id="bookDays" min="1" value="1"
                    style="width:100%;padding:.55rem .75rem;border:1.5px solid #d1d5db;border-radius:8px;font-size:.95rem">
            </div>` : '';

        const modal = document.createElement('div');
        modal.id = 'booking-date-modal';
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:99999;display:flex;align-items:center;justify-content:center;padding:1rem';
        modal.innerHTML = `
            <div style="background:#fff;border-radius:16px;padding:2rem;width:100%;max-width:440px;box-shadow:0 20px 60px rgba(0,0,0,.2);animation:fadeIn .2s">
                <h3 style="margin:0 0 .25rem;color:#1e293b;font-size:1.1rem"><i class="fas fa-calendar-check" style="color:#6366f1"></i> Chọn lịch đặt dịch vụ</h3>
                <p style="margin:0 0 1.25rem;font-size:.85rem;color:#64748b">${s.name}</p>

                <label style="font-size:.85rem;font-weight:600;color:#374151;display:block;margin-bottom:.4rem">
                    <i class="fas fa-calendar"></i> ${isTour ? 'Ngày khởi hành' : 'Ngày đến'}
                </label>
                <input type="date" id="bookDate" min="${today}"
                    style="width:100%;padding:.55rem .75rem;border:1.5px solid #d1d5db;border-radius:8px;font-size:.95rem;outline:none" required>
                ${durationNote}
                ${timeHtml}

                <div style="margin-top:1rem">
                    <label style="font-size:.85rem;font-weight:600;color:#374151;display:block;margin-bottom:.4rem"><i class="fas fa-users"></i> ${quantityLabel}</label>
                    <input type="number" id="bookQty" min="1" value="1"
                        style="width:100%;padding:.55rem .75rem;border:1.5px solid #d1d5db;border-radius:8px;font-size:.95rem">
                </div>
                ${peopleHtml}
                ${daysHtml}

                <div id="endDateInfo" style="display:none;margin-top:.75rem;padding:.6rem .85rem;background:#f0fdf4;border:1px solid #86efac;border-radius:8px;font-size:.82rem;color:#166534">
                    <i class="fas fa-flag-checkered"></i> Ngày kết thúc dự kiến: <b id="endDateValue"></b>
                </div>

                <div style="display:flex;gap:.75rem;margin-top:1.5rem">
                    <button id="btnCancelBook" style="flex:1;padding:.7rem;border:1.5px solid #d1d5db;border-radius:8px;background:#fff;cursor:pointer;font-weight:600;color:#64748b">Hủy</button>
                    <button id="btnConfirmBook" style="flex:2;padding:.7rem;border:none;border-radius:8px;background:#6366f1;color:#fff;cursor:pointer;font-weight:700;font-size:.95rem">
                        <i class="fas fa-check"></i> Xác nhận đặt
                    </button>
                </div>
            </div>`;

        document.body.appendChild(modal);

        // Tự tính endDate cho Tour
        if (isTour && s.durationDays) {
            document.getElementById('bookDate').addEventListener('change', (e) => {
                const d = new Date(e.target.value);
                d.setDate(d.getDate() + s.durationDays);
                document.getElementById('endDateValue').textContent = d.toLocaleDateString('vi-VN');
                document.getElementById('endDateInfo').style.display = 'block';
            });
        }

        document.getElementById('btnCancelBook').onclick = () => { modal.remove(); resolve(null); };
        modal.addEventListener('click', (e) => { if (e.target === modal) { modal.remove(); resolve(null); } });

        document.getElementById('btnConfirmBook').onclick = () => {
            const bookingDate = document.getElementById('bookDate').value;
            if (!bookingDate) { alert('Vui lòng chọn ngày đặt!'); return; }
            const bookingTime = hasTime ? document.getElementById('bookTime').value : null;
            if (hasTime && !bookingTime) { alert('Vui lòng chọn giờ đến!'); return; }
            const quantity = parseInt(document.getElementById('bookQty').value) || 1;
            const numberOfPeople = !isTour ? (parseInt(document.getElementById('bookPeople').value) || 1) : quantity;
const bookingDays = isHotel ? (parseInt(document.getElementById('bookDays').value) || 1) : (s.durationDays || 1);            modal.remove();
            resolve({ quantity, bookingDays, bookingDate, bookingTime, numberOfPeople });
        };
    });
}

let detailMap;
function showServiceDetail(id) {
    window.location.href = 'service-detail.html?id=' + id;
}

// ── 8. WEBSOCKET NHẬN THÔNG BÁO VÀ KHỞI ĐỘNG ─────────────
let stompClient = null;

function loadUnreadNotifications() {
    fetch('/api/notifications/unread')
      .then(r => { if (!r.ok) throw new Error('no auth'); return r.json(); })
      .then(data => {
        const badge = document.getElementById('unreadCount');
        const list  = document.getElementById('notifList');
        if (!badge || !list) return;

        if (data.unreadCount > 0) {
            badge.style.display = 'inline-block';
            badge.innerText = data.unreadCount;
        } else {
            badge.style.display = 'none';
        }

        if (data.notifications && data.notifications.length > 0) {
            list.innerHTML = data.notifications.map(n => {
                const icon = n.type === 'ORDER_APPROVED' ? 'fa-check-circle' :
                             n.type === 'VNPAY_SUCCESS'  ? 'fa-credit-card' : 'fa-bell';
                const t = n.createdAt ? new Date(n.createdAt).toLocaleString('vi-VN',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit'}) : '';
                return `<div onclick="handleNotifClick(${n.id},'${n.linkTarget || 'billing'}')" 
                    style="cursor:pointer;padding:10px 12px;border-bottom:1px solid #e2e8f0;color:#1e293b;display:flex;gap:10px;align-items:flex-start"
                    onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='transparent'">
                  <i class="fas ${icon}" style="color:#818cf8;margin-top:3px;flex-shrink:0"></i>
                  <div><div style="font-size:.82rem">${n.message}</div>
                  <div style="font-size:.72rem;color:#64748b;margin-top:3px">${t}</div></div>
                </div>`;
            }).join('');
        } else {
            list.innerHTML = '<div style="padding:12px;color:#64748b;text-align:center"><i class="fas fa-check-double"></i> Không có thông báo mới</div>';
        }
      }).catch(() => {});
}

async function handleNotifClick(id, target) {
    await fetch(`/api/notifications/mark-read/${id}`, {method:'POST'});
    const navLink = document.querySelector(`.nav-link[data-target="${target}"]`);
    if (navLink) navLink.click();
    loadUnreadNotifications();
}

function connectWebSocket(username) {
    const socket = new SockJS('/ws');
    stompClient = Stomp.over(socket);
    stompClient.debug = null;
    stompClient.connect({}, function () {
        stompClient.subscribe('/topic/user/notifications/' + username, function (msg) {
            showToast(msg.body);
            loadUnreadNotifications();
            fetchMyOrders();
        });
    });
}

document.getElementById('btnNotifications').addEventListener('click', () => {
    loadUnreadNotifications();
});

// Khối khởi tạo cũ đã được hợp nhất xuống dưới

// ── 9. BẢN ĐỒ KHÁM PHÁ (EXPLORER MAP) ─────────────────────
window.explorerMap = null;
let explorerMapGroup = null;

function initExplorerMap(data) {
    const mapContainer = document.getElementById('osm-map');
    if (!mapContainer) return;
    
    if (!window.explorerMap) {
        window.explorerMap = L.map('osm-map').setView([11.940419, 108.458313], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap'
        }).addTo(window.explorerMap);
        explorerMapGroup = L.featureGroup().addTo(window.explorerMap);

        // Đảm bảo map tự động căn lại size khi hiển thị từ tab ẩn
        const resizeObserver = new ResizeObserver(() => {
            window.explorerMap.invalidateSize();
        });
        resizeObserver.observe(mapContainer);
    } else {
        explorerMapGroup.clearLayers();
    }

    if (!data || data.length === 0) return;

    data.forEach(s => {
        if (!s.mapPoints) return;
        const pts = s.mapPoints.split('|').filter(x => x);
        if (pts.length === 0) return;
        
        const firstPt = pts[0].split(',');
        if (firstPt.length < 2) return;

        const lat = parseFloat(firstPt[0]);
        const lng = parseFloat(firstPt[1]);
        if (isNaN(lat) || isNaN(lng)) return;

        const priceStr = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(s.price);

        const safeThumb = (s.imageUrl && (s.imageUrl.startsWith('http') || s.imageUrl.startsWith('/'))) ? s.imageUrl : `https://picsum.photos/seed/${s.id}/200/100`;
        const html = `
            <div style="font-family:'Inter',sans-serif;width:200px">
                <img src="${safeThumb}" style="width:100%;height:100px;object-fit:cover;border-radius:8px;margin-bottom:8px" onerror="this.src='https://picsum.photos/seed/${s.id}/200/100'">
                <h4 style="margin:0;font-size:14px;color:#1e293b">${s.name}</h4>
                <div style="font-size:12px;color:#64748b;margin:4px 0">${s.type} • ${s.agencyName}</div>
                <div style="font-size:14px;font-weight:bold;color:#f43f5e;margin-bottom:8px">${priceStr}</div>
                <button onclick="bookService(${s.id})" class="btn btn-primary" style="width:100%;padding:4px 0;font-size:12px">Đặt Ngay</button>
            </div>
        `;
        
        let marker = L.marker([lat, lng]).bindPopup(html);
        explorerMapGroup.addLayer(marker);
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log("User dashboard initializing...");
    initTabs();
    
    // 1. Tải thông tin cá nhân & Websocket
    try {
        const res = await fetch('/api/user/me');
        if (res.ok) {
            const user = await res.json();
            const displayName = document.getElementById('userDisplayName');
            if (displayName) displayName.innerText = (user.fullName || user.username) + ' (Khách Hàng) ▼';
            connectWebSocket(user.username);
        }
    } catch(e) { console.warn("User profile load failed", e); }

    // 2. Load thông báo
    if (typeof loadUnreadNotifications === 'function') loadUnreadNotifications();

    // 3. Tự động tải dữ liệu cho tab active
    const activeTab = document.querySelector('.nav-link.active');
    if (activeTab) {
        const target = activeTab.getAttribute('data-target');
        if (target === 'booking') fetchServices();
        if (target === 'ai-itinerary') { /* AI tab content is static until generate */ }
    }
    // Luôn tải đơn hàng ngay khi vào trang (không chờ click tab)
    fetchMyOrders();

    // 4. Các khởi tạo khác
    if (typeof initServiceForm === 'function') initServiceForm();
    
    // Luôn fetch services ngầm để có dữ liệu cho map và booking
    fetchServices().then(() => {
        if (window._servicesData) initExplorerMap(window._servicesData);
    });

    console.log("User.js initialization complete.");
});
