/* =========================================================
   staff.js – Smart Tour Đà Lạt – Đại Lý (Staff)
   ========================================================= */

// ── 1. TOAST ─────────────────────────────────────────────
function showToast(msg, isError = false) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.style.background = isError
        ? 'linear-gradient(135deg,#f43f5e,#fb7185)'
        : 'linear-gradient(135deg,#10b981,#34d399)';
    t.innerHTML = `<i class="fas fa-${isError ? 'circle-xmark' : 'circle-check'}"></i> ${msg}`;
    t.style.transform = 'translateY(0)';
    t.style.opacity = '1';
    setTimeout(() => { t.style.transform = 'translateY(100px)'; t.style.opacity = '0'; }, 3200);
}

// ── 2. THÔNG TIN NHÂN VIÊN & WEBSOCKET ──────────────────
let stompClient = null;

function loadUnreadNotifications() {
    fetch('/api/notifications/unread')
      .then(r => { if (!r.ok) throw new Error('fetch error'); return r.json(); })
      .then(data => {
        const badge = document.getElementById('unreadCount');
        const list  = document.getElementById('notifList');
        if (!badge || !list) return;

        badge.style.display = data.unreadCount > 0 ? 'inline-block' : 'none';
        if (data.unreadCount > 0) badge.innerText = data.unreadCount;

        if (data.notifications && data.notifications.length > 0) {
            list.innerHTML = data.notifications.map(n => {
                const icon = n.type === 'ORDER_PENDING' ? 'fa-shopping-cart' : 'fa-bell';
                const t = n.createdAt ? new Date(n.createdAt).toLocaleString('vi-VN',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit'}) : '';
                return `<div onclick="handleNotifClick(${n.id},'${n.linkTarget || 'orders'}')"
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
      }).catch(e => console.error("Notification Fetch Error:", e));
}

async function handleNotifClick(id, target) {
    await fetch(`/api/notifications/mark-read/${id}`, {method:'POST'});
    const navLink = document.querySelector(`.nav-link[data-target="${target}"]`);
    if (navLink) navLink.click();
    document.getElementById('notifList').style.display = 'none';
    loadUnreadNotifications();
}

function connectWebSocket(topicNode) {
    const socket = new SockJS('/ws');
    stompClient = Stomp.over(socket);
    stompClient.debug = null;
    stompClient.connect({}, function (frame) {
        stompClient.subscribe('/topic/' + topicNode + '/notifications', function (msg) {
            try {
                const pd = JSON.parse(msg.body);
                showToast(pd.message || msg.body);
            } catch(e) {
                showToast(msg.body);
            }
            loadUnreadNotifications();
            fetchOrders();
            // Nếu có thông báo PAID thì cập nhật dờ doanh thu luôn
            const revenueTab = document.getElementById('revenue');
            if (revenueTab && revenueTab.style.display !== 'none') fetchRevenue();
        });
    });
}

if(document.getElementById('btnNotifications')) {
    document.getElementById('btnNotifications').addEventListener('click', () => {
        loadUnreadNotifications();
    });
}

async function fetchInfo() {
    try {
        const res = await fetch('/api/staff/me');
        if (res.status === 401 || res.status === 403) {
            showToast('Phiên đăng nhập hết hạn!', true);
            setTimeout(() => location.href = 'login.html', 1500);
            return;
        }
        if (!res.ok) return;
        const d = await res.json();
        const el = document.getElementById('agencyName');
        if (el) el.innerText = d.agencyName || d.username || 'Đại lý';
        
        loadUnreadNotifications();
        connectWebSocket('staff');
    } catch {}
}

// ── 3. DANH SÁCH DỊCH VỤ (của Đại lý) ──────────────────
let allServicesData = [];

async function fetchServices() {
    const tbody = document.getElementById('servicesList');
    if (!tbody) return;
    try {
        const res = await fetch('/api/staff/services');
        if (!res.ok) return;
        allServicesData = await res.json();
        renderServicesList(allServicesData);
    } catch {}
}

function renderServicesList(data) {
    const tbody = document.getElementById('servicesList');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-cell" style="text-align:center;padding:1rem;color:#64748b">Không tìm thấy dịch vụ nào!</td></tr>';
        return;
    }
    data.forEach(s => {
        const price = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(s.salePrice || s.price || 0);
        const statusBadge = s.isApproved
            ? '<span class="badge" style="color:#10b981;background:#d1fae5;padding:4px 8px;border-radius:12px;font-size:0.75rem;font-weight:bold">✔ Đã Duyệt</span>'
            : '<span class="badge" style="color:#f59e0b;background:#fef3c7;padding:4px 8px;border-radius:12px;font-size:0.75rem;font-weight:bold">⏳ Chờ Admin Duyệt</span>';
        const sJson = encodeURIComponent(JSON.stringify(s));
        tbody.innerHTML += `
        <tr style="border-bottom:1px solid #e2e8f0">
            <td style="padding:0.75rem"><img src="${s.imageUrl}" style="width:50px;height:50px;border-radius:6px;object-fit:cover" onerror="this.src='https://picsum.photos/seed/${s.id}/60/60'"></td>
            <td style="padding:0.75rem"><b>${s.serviceName || s.name}</b><br><span style="font-size:0.8rem;color:#64748b">${s.description || ''}</span></td>
            <td style="padding:0.75rem"><span style="background:#e0e7ff;color:#4f46e5;padding:4px 8px;border-radius:6px;font-size:0.8rem;font-weight:bold">${s.serviceType || s.type}</span></td>
            <td style="padding:0.75rem;color:#f43f5e;font-weight:bold">${price}</td>
            <td style="padding:0.75rem">${statusBadge}</td>
            <td style="padding:0.75rem;text-align:right">
                <button class="btn btn-primary btn-sm" onclick="editService('${sJson}')" style="padding:6px 12px;font-size:0.8rem"><i class="fas fa-edit"></i> Sửa</button>
            </td>
        </tr>`;
    });
}

function filterServicesList() {
    const keyword = (document.getElementById('svcSearchInput')?.value || '').toLowerCase().trim();
    const typeFilter = document.getElementById('svcSearchType')?.value || '';
    const filtered = allServicesData.filter(s => {
        const name = (s.serviceName || s.name || '').toLowerCase();
        const type = (s.serviceType || s.type || '').toUpperCase();
        const matchKeyword = !keyword || name.includes(keyword);
        const matchType = !typeFilter || type === typeFilter;
        return matchKeyword && matchType;
    });
    renderServicesList(filtered);
}

// ── 4. ĐƠN ĐẶT HÀNG (Orders) ─────────────────────────────
async function fetchOrders() {
    const tbody = document.getElementById('ordersList');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:1rem"><i class="fas fa-spinner fa-spin"></i> Đang tải...</td></tr>';
    try {
        const res = await fetch('/api/staff/orders');
        if (!res.ok) return;
        const data = await res.json();
        tbody.innerHTML = '';
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-cell">Chưa có đơn đặt nào từ khách hàng!</td></tr>';
            return;
        }
        data.forEach(o => {
            let statusBadge = '';
            let actionBtn = '';
            if (o.status === 'PENDING') {
                statusBadge = '<span class="badge badge-pending">⏳ Chờ duyệt</span>';
                actionBtn = `
                    <button class="btn btn-success btn-xs" onclick="approveOrder(${o.id})" title="Xác nhận & Gửi Email"><i class="fas fa-check"></i> Duyệt</button>
                    <button class="btn btn-danger btn-xs" onclick="deleteOrder(${o.id})" title="Từ chối và Xoá"><i class="fas fa-trash"></i> Xóa</button>
                `;
            } else if (o.status === 'AWAITING_PAYMENT') {
                statusBadge = '<span class="badge" style="background:rgba(244,63,94,.15);color:#f43f5e;padding:.3rem .8rem;border-radius:999px;font-size:.7rem;font-weight:700">💳 Chờ TT</span>';
                actionBtn = `<button class="btn btn-danger btn-xs" onclick="deleteOrder(${o.id})" title="Hủy đơn chưa thanh toán"><i class="fas fa-ban"></i> Hủy đơn</button>`;
            } else if (o.status === 'PAID') {
                statusBadge = '<span class="badge" style="background:rgba(16,185,129,.15);color:#10b981;font-weight:bold;padding:.3rem .8rem;border-radius:999px;font-size:.7rem">✔ ĐÃ TT</span>';
                actionBtn = `<button class="btn btn-primary btn-xs" onclick="startTrip(${o.id})"><i class="fas fa-play"></i> Bắt đầu</button>`;
            } else if (o.status === 'IN_PROGRESS') {
                if (o.serviceType === 'HOTEL') {
                    statusBadge = '<span class="badge" style="background:rgba(139,92,246,.15);color:#8b5cf6;font-weight:bold;padding:.3rem .8rem;border-radius:999px;font-size:.7rem"><i class="fas fa-bed"></i> ĐANG SD</span>';
                    actionBtn = `<span style="color:#94a3b8;font-size:0.72rem"><i class="fas fa-robot"></i> Tự kết thúc</span>`;
                } else {
                    statusBadge = '<span class="badge" style="background:rgba(139,92,246,.15);color:#8b5cf6;font-weight:bold;padding:.3rem .8rem;border-radius:999px;font-size:.7rem"><i class="fas fa-route"></i> ĐANG TH</span>';
                    actionBtn = `<button class="btn btn-success btn-xs" onclick="completeTrip(${o.id})"><i class="fas fa-flag-checkered"></i> Hoàn thành</button>`;
                }
            } else if (o.status === 'COMPLETED') {
                statusBadge = '<span class="badge" style="background:rgba(100,116,139,.15);color:#64748b;font-weight:bold;padding:.3rem .8rem;border-radius:999px;font-size:.7rem">✅ KẾT THÚC</span>';
                actionBtn = `<span style="color:#94a3b8;font-size:0.72rem">Không thao tác</span>`;
            } else if (o.status === 'CANCELLED') {
                statusBadge = '<span class="badge" style="background:rgba(239,68,68,.1);color:#ef4444;font-weight:bold;padding:.3rem .8rem;border-radius:999px;font-size:.7rem">🚫 ĐÃ HỦY</span>';
                actionBtn = `<span style="color:#94a3b8;font-size:0.72rem">Đã hủy</span>`;
            }

            const amount = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(o.totalAmount);
            const oEncoded = encodeURIComponent(JSON.stringify(o));
            tbody.innerHTML += `
            <tr>
                <td class="order-id">#${String(o.id).padStart(5,'0')}</td>
                <td>${o.customerName}</td>
                <td class="text-sm">${o.serviceName}</td>
                <td class="price-cell">${amount}</td>
                <td style="text-align:center;white-space:nowrap">${statusBadge}</td>
                <td>
                    <div style="display:flex;gap:6px;justify-content:flex-end;align-items:center;flex-wrap:nowrap">
                        <button class="btn btn-primary btn-xs" onclick="showOrderDetail('${oEncoded}')" style="background:#6366f1;border:none;white-space:nowrap"><i class="fas fa-eye"></i> Chi tiết</button>
                        ${actionBtn}
                    </div>
                </td>
            </tr>`;
        });
    } catch(e) { console.error(e); }
}

async function approveOrder(id) {
    try {
        const res = await fetch(`/api/staff/orders/${id}/approve`, { method: 'POST' });
        const dt = await res.json().catch(() => ({}));
        if (res.ok) {
            showToast('Đã xác nhận đơn hàng #' + String(id).padStart(5,'0'));
            // Cập nhật ngay dòng trong bảng mà không cần reload trang
            const rows = document.querySelectorAll('#orderTableBody tr');
            for (const row of rows) {
                if (row.querySelector('.order-id')?.textContent === '#' + String(id).padStart(5,'0')) {
                    row.querySelector('td:nth-child(5)').innerHTML = '<span class="badge" style="background:rgba(244,63,94,.15);color:#f43f5e;padding:.3rem .8rem;border-radius:999px;font-size:.7rem;font-weight:700">💳 Chờ Thanh Toán</span>';
                    row.querySelector('td:nth-child(6) div').innerHTML = `
                        <button class="btn btn-primary btn-xs" onclick="showOrderDetail(this.closest('tr').dataset.encoded)" style="background:#6366f1;border:none"><i class="fas fa-eye"></i> Chi tiết</button>
                        <span style="color:var(--text-muted);font-size:0.75rem;align-self:center">Chờ Khách VNPAY</span>
                        <button class="btn btn-danger btn-xs" onclick="deleteOrder(${id})"><i class="fas fa-ban"></i> Hủy đơn</button>
                    `;
                    break;
                }
            }
            // Reload lại toàn bộ sau 1 giây để đồng bộ
            setTimeout(() => fetchOrders(), 1000);
        } else {
            showToast(dt.error || 'Lỗi xác nhận đơn!', true);
        }
    } catch(err) { showToast('Lỗi mạng', true); }
}

async function deleteOrder(id) {
    if (!confirm('Hành động này sẽ Hủy Đơn hàng #'+String(id).padStart(5,'0')+'. Bạn chắc chắn chứ?')) return;
    try {
        const res = await fetch(`/api/staff/orders/${id}/cancel`, { method: 'POST' });
        if (res.ok) { 
            showToast('Đã hủy đơn hàng & hoàn trả lại slot trống thành công!'); 
            setTimeout(() => { fetchOrders(); fetchServices(); }, 400);
        }
        else {
            try { const dt = await res.json(); showToast(dt.error || 'Lỗi thao tác hủy!', true); } 
            catch(e) { showToast('Lỗi hệ thống: HTTP ' + res.status, true); }
        }
    } catch(err) { showToast('Mất kết nối mạng', true); }
}

async function startTrip(id) {
    if (!confirm('Bạn xác nhận Bắt đầu chuyến đi này? Khách hàng sẽ nhận thông báo.')) return;
    try {
        const res = await fetch(`/api/staff/orders/${id}/start`, { method: 'POST' });
        if (res.ok) {
            showToast('Đã thiết lập trạng thái Đang tiến hành!');
            setTimeout(() => fetchOrders(), 400);
        }
        else {
            try { const dt = await res.json(); showToast(dt.error || 'Lỗi thao tác!', true); }
            catch(e) { showToast('Lỗi HTTP: ' + res.status, true); }
        }
    } catch(err) { showToast('Lỗi mạng', true); }
}

async function completeTrip(id) {
    if (!confirm('Bạn xác nhận khách hàng đã Hoàn thành chuyến đi? (Sẽ hoàn lại Slot/Số Chuyến vào Dịch vụ)')) return;
    try {
        const res = await fetch(`/api/staff/orders/${id}/complete`, { method: 'POST' });
        if (res.ok) { 
            showToast('Đã Hoàn thành chuyến đi và hoàn Slot!'); 
            setTimeout(() => { fetchOrders(); fetchServices(); }, 400);
        }
        else {
            try { const dt = await res.json(); showToast(dt.error || 'Lỗi thao tác!', true); }
            catch(e) { showToast('Lỗi HTTP: ' + res.status, true); }
        }
    } catch(err) { showToast('Lỗi mạng', true); }
}

function showOrderDetail(encodedData) {
    const o = JSON.parse(decodeURIComponent(encodedData));
    const fmt = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);
    const statusLabels = {
        PENDING: '⏳ Chờ Đại Lý Duyệt',
        AWAITING_PAYMENT: '💳 Chờ Thanh Toán VNPAY',
        PAID: '✅ Đã Thanh Toán',
        IN_PROGRESS: '🚀 Đang Tiến Hành',
        COMPLETED: '🏁 Đã Hoàn Thành',
        CANCELLED: '❌ Đã Hủy'
    };

    const rows = [
        ['👤 Khách hàng', `<b>${o.customerName || '—'}</b>`],
        ['📦 Dịch vụ', o.serviceName || '—'],
        ['🏷️ Loại hình', o.serviceType || '—'],
        ['📅 Ngày đến', o.bookingDate || '—'],
        ['⏰ Giờ đến', o.bookingTime ? `<b>${o.bookingTime}</b>` : '—'],
        ['🏁 Ngày kết thúc', o.endDate || '—'],
[o.serviceType === 'HOTEL' ? '🌙 Thời gian thuê' : '🌙 Thời lượng', o.bookingDays ? `<b>${o.bookingDays}</b> ${o.serviceType === 'HOTEL' ? 'đêm' : 'ngày'}` : '—'],        ['👥 Số lượng đặt', o.quantity ? `<b>${o.quantity}</b> ${o.serviceType === 'HOTEL' ? 'phòng' : 'người'}` : '—'],
        ['📅 Ngày tạo đơn', o.orderDate || '—'],
        ['💰 Tổng tiền', `<span style="color:#f43f5e;font-weight:bold;font-size:1.1rem">${fmt(o.totalAmount)}</span>`],
        ['📋 Trạng thái', `<span style="font-weight:700">${statusLabels[o.status] || o.status}</span>`],
    ];

    // Xóa modal cũ nếu còn
    const existing = document.getElementById('_orderDetailModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = '_orderDetailModal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:1rem;backdrop-filter:blur(4px)';
    modal.innerHTML = `
    <div style="background:#fff;border-radius:20px;padding:2.2rem;width:100%;max-width:450px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);position:relative">
        <button onclick="document.getElementById('_orderDetailModal').remove()" style="position:absolute;top:15px;right:18px;background:none;border:none;font-size:1.5rem;cursor:pointer;color:#94a3b8">×</button>
        <h3 style="margin-bottom:1.8rem;font-size:1.2rem;color:#1e293b;display:flex;align-items:center;gap:10px">
            <i class="fas fa-receipt" style="color:#6366f1"></i> Chi Tiết Đơn Hàng #${String(o.id).padStart(5,'0')}
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
        <div style="margin-top:2rem;display:flex;gap:.8rem;justify-content:flex-end">
            <button onclick="document.getElementById('_orderDetailModal').remove()" style="padding:10px 25px;border:1.5px solid #e2e8f0;border-radius:10px;background:#fff;cursor:pointer;font-weight:700;color:#64748b">Đóng cửa sổ</button>
        </div>
    </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', function(e) { if (e.target === this) this.remove(); });
}

// ── 5. FORM ĐĂNG DỊCH VỤ ─────────────────────────────────
function initServiceForm() {
    const form = document.getElementById('serviceForm');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type=submit]');
        const orig = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang tải lên...';
        btn.disabled = true;

        const fd = new FormData();
        fd.append('name',        document.getElementById('svcName').value);
        fd.append('type',        document.getElementById('svcType').value);
        fd.append('price',       document.getElementById('svcPrice').value);
        fd.append('description', document.getElementById('svcDesc').value);
        fd.append('maxPeople',   document.getElementById('svcMaxPeople').value || '1');
        
        if (document.getElementById('svcType').value === 'TOUR') {
            fd.append('durationDays', document.getElementById('svcDuration').value);
            fd.append('transportation', document.getElementById('svcTransport').value);
            if(document.getElementById('svcAvailableTrips')) fd.append('availableTrips', document.getElementById('svcAvailableTrips').value);
        } else {
            fd.append('openingTime', document.getElementById('svcOpenTime').value || '');
            fd.append('closingTime', document.getElementById('svcCloseTime').value || '');
            if (document.getElementById('svcType').value === 'HOTEL') {
                fd.append('availableRooms', document.getElementById('svcAvailableRooms').value || '');
            }
        }

        fd.append('mapPoints',   document.getElementById('svcMapPoints').value || '');
        const imgInput = document.getElementById('svcImage');
        if (imgInput && imgInput.files[0]) fd.append('image', imgInput.files[0]);

        const editId = document.getElementById('editServiceId')?.value;
        const url = editId ? `/api/staff/services/${editId}/update` : '/api/staff/services';

        try {
            const res = await fetch(url, { method: 'POST', body: fd });
            if (res.ok) {
                const d = await res.json();
                showToast(d.message || 'Thành công!');
                cancelEdit();
                fetchServices();
            } else if (res.status === 401 || res.status === 403) {
                showToast('Phiên đăng nhập hết hạn!', true);
                setTimeout(() => location.href = 'login.html', 1500);
            } else {
                const err = await res.text().catch(() => 'Lỗi không xác định');
                showToast('❌ ' + err.substring(0, 100), true);
            }
        } catch { showToast('❌ Không kết nối Server!', true); }
        finally { btn.innerHTML = orig; btn.disabled = false; }
    });
}

function editService(svcStr) {
    const svc = JSON.parse(decodeURIComponent(svcStr));
    document.getElementById('editServiceId').value = svc.id;
    document.getElementById('svcName').value = svc.serviceName || svc.name || '';
    document.getElementById('svcType').value = svc.serviceType || svc.type || 'TOUR';
    document.getElementById('svcPrice').value = svc.salePrice || svc.price || 0;
    document.getElementById('svcDesc').value = svc.description || '';
    
    // Trigger event cập nhật form fields
    const ev = new Event('change');
    document.getElementById('svcType').dispatchEvent(ev);

    document.getElementById('svcMaxPeople').value = svc.maxPeople || '';
    if ((svc.serviceType || svc.type) === 'TOUR') {
        document.getElementById('svcDuration').value = svc.durationDays || '';
        document.getElementById('svcTransport').value = svc.transportation || '';
        if(document.getElementById('svcAvailableTrips')) document.getElementById('svcAvailableTrips').value = svc.availableTrips || '';
    } else {
        document.getElementById('svcOpenTime').value = svc.openingTime || '';
        document.getElementById('svcCloseTime').value = svc.closingTime || '';
        if ((svc.serviceType || svc.type) === 'HOTEL') {
            document.getElementById('svcAvailableRooms').value = svc.availableRooms || '';
        }
    }

    // Hiển thị Preview Ảnh
    const imgPreview = document.getElementById('svcImagePreview');
    if (imgPreview) {
        if (svc.imageUrl) {
            imgPreview.src = svc.imageUrl;
            imgPreview.style.display = 'block';
        } else {
            imgPreview.style.display = 'none';
        }
    }

    document.getElementById('btnCancelEdit').style.display = 'inline-block';
    document.querySelector('.nav-link[data-target="manage"]').click();
    
    // Khôi phục Bản đồ
    setTimeout(() => {
        clearServiceMap();
        if (svc.mapPoints) {
            const arr = svc.mapPoints.split('|').filter(x=>x);
            arr.forEach(p => {
                const parts = p.split(';');
                const ll = parts[0].split(',');
                const lat = parseFloat(ll[0]);
                const lng = parseFloat(ll[1]);
                if (isNaN(lat) || isNaN(lng)) return;
                
                const m = L.marker([lat, lng], { draggable: true }).addTo(serviceMapL);
                m.placeName = parts[1] || 'Địa điểm';
                m.placeImage = parts[2] || '';
                m.placeTime = parts[3] || '';
                
                const idx = serviceMarkers.length;
                m.bindPopup(`
                    <div style="min-width:180px;font-family:sans-serif;text-align:center">
                        <b style="color:#2563eb;font-size:14px;display:block;margin-bottom:8px">${m.placeName}</b>
                        ${(svc.serviceType || svc.type) === 'TOUR' ? `<input type="text" placeholder="Tgian ở đây (VD: 08:30 - 10:00)" value="${m.placeTime}" style="width:100%;margin-bottom:6px;font-size:11px;padding:4px;border:1px solid #cbd5e1;border-radius:4px" onchange="serviceMarkers[${idx}].placeTime=this.value; updateServicePoints()">` : ''}
                        <label style="font-size:11px;color:#64748b;font-weight:bold;display:block;margin-bottom:4px;cursor:pointer;background:#f8fafc;padding:4px;border-radius:4px;border:1px dashed #cbd5e1">
                            <i class="fas fa-camera"></i> Đổi ảnh địa danh
                            <input type="file" style="display:none" accept="image/*" onchange="uploadPointImage(event, ${idx})">
                        </label>
                        <div id="p-img-${idx}" style="margin-top:6px;border-radius:6px;overflow:hidden">
                            ${m.placeImage ? `<img src="${m.placeImage}" style="width:100%;height:80px;object-fit:cover;border-radius:6px">` : ''}
                        </div>
                    </div>
                `);
                m.on('dragend', updateServicePoints);
                serviceMarkers.push(m);
            });
            updateServicePoints();
            if (serviceMarkers.length > 0) {
                const group = new L.featureGroup(serviceMarkers);
                serviceMapL.fitBounds(group.getBounds(), {padding: [30, 30]});
            }
        }
    }, 300);

    showToast('Đang chỉnh sửa: ' + (svc.serviceName || svc.name));
    window.scrollTo({top: 0, behavior: 'smooth'});
}

function cancelEdit() {
    const el = document.getElementById('editServiceId');
    if(el) el.value = '';
    const imgPreview = document.getElementById('svcImagePreview');
    if(imgPreview) imgPreview.style.display = 'none';
    const btn = document.getElementById('btnCancelEdit');
    if(btn) btn.style.display = 'none';
    const form = document.getElementById('serviceForm');
    if(form) form.reset();
    clearServiceMap();
}

// ── 6. FORM THÊM ĐIỂM ĐẾN ────────────────────────────────
function initLocationForm() {
    const form = document.getElementById('locationForm');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData();
        fd.append('name', document.getElementById('locName').value);
        fd.append('coordinates', document.getElementById('locCoords').value);
        const fileInput = document.getElementById('locImage');
        if (fileInput && fileInput.files[0]) {
            fd.append('image', fileInput.files[0]);
        }
        
        const res = await fetch('/api/staff/locations', {
            method: 'POST',
            body: fd
        });
        if (res.ok) { showToast('Toạ độ mới đã được lưu vào Database!'); form.reset(); }
        else showToast('Lỗi khi lưu toạ độ!', true);
    });
}

// ── 7. BẢN ĐỒ ĐĂNG DỊCH VỤ (HOTEL / TOUR) ───────────────
let serviceMapL, serviceMarkers = [], servicePolyline = null;

function initServiceMap() {
    if (serviceMapL) { serviceMapL.invalidateSize(); return; }
    serviceMapL = L.map('service-map').setView([11.9404, 108.4583], 13);
    if (typeof addVietnamSovereignty === 'function') addVietnamSovereignty(serviceMapL);
    L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=vi&gl=VN', {
        attribution: 'Smart Tour Bản đồ Chủ Quyền Việt Nam'
    }).addTo(serviceMapL);

    serviceMapL.on('click', e => {
        const type = document.getElementById('svcType').value;
        const max  = type === 'HOTEL' ? 1 : 5;
        if (serviceMarkers.length >= max) {
            if (type === 'HOTEL') {
                serviceMapL.removeLayer(serviceMarkers[0]);
                serviceMarkers = [];
            } else {
                showToast(`Tour chỉ tối đa ${max} điểm dừng!`, true); return;
            }
        }
        
        let placeName = 'Khách sạn/Dịch vụ';
        if (type === 'TOUR') {
            const nth = serviceMarkers.length === 0 ? 'Bắt đầu' : (serviceMarkers.length === max - 1 ? 'Kết thúc' : (serviceMarkers.length + 1));
            placeName = prompt(`Nhập tên địa điểm ${nth} (VD: Chợ Đà Lạt):`);
            if (!placeName) return; // Huỷ chấm nếu ko nhập
        }

        const idx = serviceMarkers.length;
        const m = L.marker(e.latlng, { draggable: true }).addTo(serviceMapL);
        m.placeName = placeName.replace(/;/g, ' '); // Tránh lỗi delimiter
        
        m.bindPopup(`
            <div style="min-width:180px;font-family:sans-serif;text-align:center">
                <b style="color:#2563eb;font-size:14px;display:block;margin-bottom:8px">${m.placeName}</b>
                ${type === 'TOUR' ? `<input type="text" placeholder="Tgian ở đây (VD: 08:30 - 10:00)" style="width:100%;margin-bottom:6px;font-size:11px;padding:4px;border:1px solid #cbd5e1;border-radius:4px" onchange="serviceMarkers[${idx}].placeTime=this.value; updateServicePoints()">` : ''}
                <label style="font-size:11px;color:#64748b;font-weight:bold;display:block;margin-bottom:4px;cursor:pointer;background:#f8fafc;padding:4px;border-radius:4px;border:1px dashed #cbd5e1">
                    <i class="fas fa-camera"></i> Tải ảnh địa danh này
                    <input type="file" style="display:none" accept="image/*" onchange="uploadPointImage(event, ${idx})">
                </label>
                <div id="p-img-${idx}" style="margin-top:6px;border-radius:6px;overflow:hidden"></div>
            </div>
        `).openPopup();
        
        serviceMarkers.push(m);
        m.on('dragend', updateServicePoints);
        updateServicePoints();
    });
}

async function uploadPointImage(event, idx) {
    const file = event.target.files[0];
    if (!file) return;
    const m = serviceMarkers[idx];
    if (!m) return;
    
    document.getElementById(`p-img-${idx}`).innerHTML = `<i class="fas fa-spinner fa-spin"></i> Đang tải...`;
    
    const fd = new FormData();
    fd.append('file', file);
    try {
        const res = await fetch('/api/staff/upload-image', { method: 'POST', body: fd });
        if (!res.ok) throw new Error("Lỗi tải ảnh");
        const data = await res.json();
        m.placeImage = data.url;
        document.getElementById(`p-img-${idx}`).innerHTML = `<img src="${data.url}" style="width:100%;height:80px;object-fit:cover;border-radius:6px">`;
        updateServicePoints();
    } catch(e) {
        document.getElementById(`p-img-${idx}`).innerHTML = `<span style="color:red;font-size:11px">Lỗi up ảnh</span>`;
    }
}

function updateServicePoints() {
    const coords = serviceMarkers.map(m => m.getLatLng().lat.toFixed(6) + ',' + m.getLatLng().lng.toFixed(6) + ';' + (m.placeName || '') + ';' + (m.placeImage || '') + ';' + (m.placeTime || ''));
    document.getElementById('svcMapPoints').value = coords.join('|');
    if (serviceMarkers.length > 1) {
        if (servicePolyline) serviceMapL.removeLayer(servicePolyline);
        servicePolyline = L.polyline(serviceMarkers.map(m => m.getLatLng()), {
            color: '#f43f5e', weight: 4, dashArray: '8,10'
        }).addTo(serviceMapL);
    } else if (servicePolyline) {
        serviceMapL.removeLayer(servicePolyline);
        servicePolyline = null;
    }
}

function clearServiceMap() {
    serviceMarkers.forEach(m => serviceMapL && serviceMapL.removeLayer(m));
    serviceMarkers = [];
    if (servicePolyline) { serviceMapL && serviceMapL.removeLayer(servicePolyline); servicePolyline = null; }
    const el = document.getElementById('svcMapPoints');
    if (el) el.value = '';
}

// ── 8. BẢN ĐỒ HỖ TRỢ ĐỊA ĐIỂM ──────────────────────────
let locMap, locMarker;

function initLocMap() {
    if (locMap) { locMap.invalidateSize(); return; }
    locMap = L.map('osm-map').setView([11.9404, 108.4583], 13);
    if (typeof addVietnamSovereignty === 'function') addVietnamSovereignty(locMap);
    L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=vi&gl=VN', {
        attribution: 'Smart Tour Bản đồ Chủ Quyền Việt Nam'
    }).addTo(locMap);
    locMarker = L.marker([11.9404, 108.4583], { draggable: true }).addTo(locMap);
    document.getElementById('locCoords').value = '11.940400, 108.458300';
    locMap.on('click', e => {
        locMarker.setLatLng(e.latlng);
        document.getElementById('locCoords').value = e.latlng.lat.toFixed(6) + ', ' + e.latlng.lng.toFixed(6);
    });
    locMarker.on('dragend', () => {
        const p = locMarker.getLatLng();
        document.getElementById('locCoords').value = p.lat.toFixed(6) + ', ' + p.lng.toFixed(6);
    });
}

// ── 9. SỰ KIỆN CHUYỂN TAB (bổ sung cho bản đồ) ───────────
function initStaffTabs() {
    document.querySelectorAll('.nav-link[data-target]').forEach(link => {
        link.addEventListener('click', () => {
            const t = link.getAttribute('data-target');
            if (t === 'locations') setTimeout(initLocMap, 150);
            if (t === 'manage') { setTimeout(initServiceMap, 150); fetchServices(); }
            if (t === 'orders') fetchOrders();
            if (t === 'revenue') {
                fetchRevenue(); 
                setTimeout(() => loadStaffChart(), 150); // Vẽ lại biểu đồ khi mở Tab
            }
        });
    });
}

// ── 9. DOANH THU & HOA HỒNG ─────────────────────────────────
async function fetchRevenue() {
    try {
        const res = await fetch('/api/staff/revenue');
        if (!res.ok) { showToast('Không thể tải dữ liệu doanh thu!', true); return; }
        const d = await res.json();
        const fmt = v => new Intl.NumberFormat('vi-VN', {style:'currency',currency:'VND'}).format(v);
        document.getElementById('rv-total').innerText = fmt(d.totalRevenue);
        document.getElementById('rv-commission').innerText = fmt(d.totalCommission);
        document.getElementById('rv-net').innerText = fmt(d.netRevenue);

        const tbody = document.getElementById('commissionHistory');
        if (!d.history || d.history.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-cell">Chưa có giao dịch nào được thanh toán.</td></tr>';
            return;
        }
        tbody.innerHTML = d.history.map(r => `
            <tr>
                <td style="font-family:monospace;color:#818cf8">#${String(r.orderId).padStart(5,'0')}</td>
                <td>${fmt(r.orderRevenue)}</td>
                <td style="color:#f43f5e;font-weight:bold">${fmt(r.commissionAmount)}</td>
                <td><span class="badge badge-approved">✔ Đã Nộp</span></td>
                <td style="font-size:.8rem;color:var(--text-muted)">${r.createdAt.replace('T',' ').substring(0,16)}</td>
            </tr>
        `).join('');
        loadStaffChart(); // Thêm dòng này vào cuối cùng của khối try {...}
    } catch (e) { showToast('Lỗi kết nối: ' + e.message, true); }
}

let staffChartInstance = null;

async function loadStaffChart() {
    try {
        const res = await fetch('/api/staff/chart-data');
        if (!res.ok) return;
        const data = await res.json();
        
        const ctx = document.getElementById('staffRevenueChart');
        if (!ctx) return;

        if (staffChartInstance) staffChartInstance.destroy();

        staffChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
                datasets: [{
                    label: 'Doanh Thu Đại Lý (VNĐ)',
                    data: data.monthlyRevenue,
                    backgroundColor: '#10b981',
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // QUAN TRỌNG: Chống lỗi 0px khi đổi Tab
                scales: { y: { beginAtZero: true } }
            }
        });
    } catch (e) { console.error("Lỗi vẽ biểu đồ Staff:", e); }
}

// ── 10. TYPE CHANGE (Hotel vs Tour) ────────────────────────
function initTypeChange() {
    const sel = document.getElementById('svcType');
    if (!sel) return;
    sel.addEventListener('change', () => {
        clearServiceMap();
        const isTour = sel.value === 'TOUR';
        const isHotel = sel.value === 'HOTEL';
        
        document.querySelectorAll('.tour-only').forEach(el => {
            el.style.display = isTour ? 'flex' : 'none';
        });
        document.querySelectorAll('.not-tour').forEach(el => {
            el.style.display = !isTour ? 'flex' : 'none';
        });
        document.querySelectorAll('.hotel-only').forEach(el => {
            el.style.display = isHotel ? 'flex' : 'none';
        });

        const hint = document.getElementById('map-instruction');
        if (hint) hint.innerText = isTour
            ? '(Chạm 1–5 điểm liên tiếp để vẽ Lộ trình Tour)'
            : '(Chạm 1 điểm để ghim toạ độ)';
            
        // Cập nhật nhãn label cho Sức chứa dựa trên loại hình
        const labelMax = document.querySelector('label[for=svcMaxPeople]') || document.getElementById('labelMaxPeople');
        if (labelMax) {
            labelMax.innerText = isTour ? "Số người tối đa / Chuyến" : 
                                 isHotel ? "Sức chứa tối đa (người/phòng)" : "Sức chứa tối đa (người/đơn vị)";
        }
    });
}

// ── 11. KHỞI ĐỘNG ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    fetchInfo();
    fetchServices();
    fetchOrders();
    
    // THÊM 2 DÒNG NÀY: Tự động tải số Doanh thu và vẽ Biểu đồ không cần bấm nút
    fetchRevenue(); 
    setTimeout(() => loadStaffChart(), 300);

    initServiceForm();
    initLocationForm();
    initStaffTabs();
    initTypeChange();
    setTimeout(initServiceMap, 200);
});

// ── 12. TRA CỨU ĐỐI TÁC ────────────────────────────────
function staffSearchPartners() {
    const keyword = document.getElementById('staffSearchKeyword').value.trim();
    const resultContainer = document.getElementById('staffSearchResults');
    const tbody = document.getElementById('staffSearchList');
    
    if (!keyword) {
        showToast('Vui lòng nhập từ khóa tìm kiếm', true);
        return;
    }
    
    resultContainer.style.display = 'block';
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:2rem;"><i class="fas fa-spinner fa-spin"></i> Đang tìm kiếm...</td></tr>';
    
    fetch(`/api/staff/search-agencies?keyword=${encodeURIComponent(keyword)}`)
        .then(res => res.json())
        .then(data => {
            if (!data || data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:2rem;color:#64748b;">Không tìm thấy đối tác nào phù hợp.</td></tr>';
                return;
            }
            
            tbody.innerHTML = data.map(a => {
                let servicesHtml = '';
                if (a.services && a.services.length > 0) {
                    servicesHtml = '<ul style="margin:0;padding-left:1.5rem;font-size:0.85rem;">' + 
                        a.services.map(s => `<li>${s.name} <span class="badge" style="background:#e2e8f0;color:#475569;font-size:0.6rem;padding:2px 4px;">${s.type}</span></li>`).join('') + 
                        '</ul>';
                } else {
                    servicesHtml = '<span style="color:#94a3b8;font-size:0.85rem;">Chưa có dịch vụ</span>';
                }
                
                return `
                <tr>
                    <td><b>${a.agencyName}</b></td>
                    <td>${a.taxCode || '—'}</td>
                    <td><div style="font-size:0.85rem;"><i class="fas fa-phone" style="width:16px;"></i> ${a.phone || '—'}<br><i class="fas fa-envelope" style="width:16px;"></i> ${a.email || '—'}</div></td>
                    <td>${servicesHtml}</td>
                </tr>`;
            }).join('');
        })
        .catch(err => {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:2rem;color:#ef4444;">Lỗi khi tra cứu.</td></tr>';
        });
}
