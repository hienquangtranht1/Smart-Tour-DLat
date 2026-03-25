/* =========================================================
   admin.js – Smart Tour Đà Lạt – Quản Trị Viên (Admin)
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

// ── 2. ĐĂNG XUẤT ─────────────────────────────────────────
function logout(e) {
    e.preventDefault();
    document.cookie = 'JSESSIONID=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    showToast('Đã đăng xuất!');
    setTimeout(() => location.href = 'index.html', 1000);
}

// ── 3. LÀM MỚI TẤT CẢ ───────────────────────────────────
function refreshAll() {
    loadDashboard();
    fetchAgencies();
    fetchServices();
    fetchConfigs();
    fetchUsers();
}

// ── 4. DASHBOARD THỐNG KÊ ────────────────────────────────
async function loadDashboard() {
    try {
        const res = await fetch('/api/admin/dashboard');
        if (!res.ok) return;
        const d = await res.json();
        setText('stat-users',      d.totalUsers);
        setText('stat-agencies',   d.totalAgencies);
        setText('stat-orders',     d.totalOrders + ' (đã PAID: ' + (d.totalPaidOrders || 0) + ')');
        setText('stat-revenue',    fmtVND(d.revenue));
        setText('stat-commission', fmtVND(d.commission));
    } catch {}

    // Preview tables
    await fetchAgencies(true);
    await fetchServices(true);
}

function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.innerText = val;
}
function fmtVND(n) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
}

// ── 5. DỊCH VỤ ───────────────────────────────────────────
async function fetchServices(isPreview = false) {
    try {
        const res = await fetch('/api/admin/services');
        if (!res.ok) return;
        const data = await res.json();
        window._servicesData = data;

        if (isPreview) {
            const tBody = document.getElementById('dash-services-preview');
            if (tBody) {
                tBody.innerHTML = data.slice(0, 3).map(s =>
                    `<tr><td>${s.name}</td><td><span class="badge badge-info">${s.type}</span></td></tr>`
                ).join('') || '<tr><td colspan="2" class="empty-cell">Chưa có dịch vụ nào</td></tr>';
            }
            return;
        }

        const tbody = document.getElementById('servicesList');
        if (!tbody) return;
        tbody.innerHTML = '';
        if (data.length === 0) {
            tbody.innerHTML = '<tr class="empty-row"><td colspan="6">Chưa có dịch vụ nào đang chờ duyệt</td></tr>';
            return;
        }
        data.forEach(s => {
            const price = fmtVND(s.price);
            const badge = s.isApproved
                ? '<span class="badge badge-success">✔ Đã Duyệt</span>'
                : '<span class="badge badge-warn">⏳ Chờ Duyệt</span>';
            const actions = s.isApproved
                ? `<div class="action-group">
                    <button class="btn btn-sm view-btn" onclick="showServiceDetail(${s.id})"><i class="fas fa-eye"></i> Xem</button>
                    <button class="btn btn-danger btn-sm" onclick="rejectService(${s.id})"><i class="fas fa-trash"></i> Xoá</button>
                   </div>`
                : `<div class="action-group">
                    <button class="btn btn-sm view-btn" onclick="showServiceDetail(${s.id})"><i class="fas fa-eye"></i> Xem</button>
                    <button class="btn btn-success btn-sm" onclick="approveService(${s.id})"><i class="fas fa-check"></i> Duyệt</button>
                    <button class="btn btn-danger btn-sm" onclick="rejectService(${s.id})"><i class="fas fa-times"></i> Từ Chối</button>
                   </div>`;
            tbody.innerHTML += `
            <tr>
                <td><img src="${s.imageUrl}" class="thumb-img" onerror="this.src='https://picsum.photos/seed/${s.id}/60/60'" alt="${s.name}"></td>
                <td><b>${s.name}</b></td>
                <td><span class="badge badge-info">${s.type}</span></td>
                <td><i class="fas fa-store text-muted"></i> ${s.agencyName}</td>
                <td>${price}</td>
                <td>${badge}</td>
                <td>${actions}</td>
            </tr>`;
        });
    } catch {}
}

async function approveService(id) {
    const res = await fetch(`/api/admin/services/${id}/approve`, { method: 'POST' });
    if (res.ok) { showToast('Đã duyệt Dịch Vụ! Khách hàng có thể đặt.'); fetchServices(); }
    else showToast('Lỗi duyệt Service!', true);
}

async function rejectService(id) {
    if (!confirm('Xoá vĩnh viễn Dịch Vụ này?')) return;
    const res = await fetch(`/api/admin/services/${id}/reject`, { method: 'POST' });
    if (res.ok) { showToast('Đã xoá Dịch Vụ!'); fetchServices(); }
    else { const e = await res.json().catch(() => ({})); showToast('Lỗi: ' + (e.error || 'Không xoá được'), true); }
}

let adminDetailMap;
function showServiceDetail(id) {
    const s = (window._servicesData || []).find(x => x.id === id);
    if (!s) return;

    const tourMeta = s.type === 'TOUR' ? `
        <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:.75rem;border-radius:8px;margin-bottom:1rem">
            <div><span style="color:var(--text-muted)">Giới hạn số người:</span> <b>${s.maxPeople || 'Vô hạn'}</b></div>
            <div><span style="color:var(--text-muted)">Số ngày:</span> <b>${s.durationDays || '?'}</b></div>
            <div><span style="color:var(--text-muted)">Phương tiện:</span> <b>${s.transportation || 'Tự túc'}</b></div>
        </div>
    ` : (s.type === 'HOTEL' || s.openingTime || s.closingTime ? `
        <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:.75rem;border-radius:8px;margin-bottom:1rem">
            ${s.type === 'HOTEL' ? `<div><span style="color:var(--text-muted)"><i class="fas fa-bed"></i> Phòng trống cơ sở:</span> <b style="color:#34d399">${s.availableRooms || 0} phòng</b></div>` : ''}
            <div><span style="color:var(--text-muted)"><i class="fas fa-door-open"></i> Giờ Mở Cửa:</span> <b>${s.openingTime || 'Chưa cập nhật'}</b></div>
            <div><span style="color:var(--text-muted)"><i class="fas fa-door-closed"></i> Giờ Đóng Cửa:</span> <b>${s.closingTime || 'Chưa cập nhật'}</b></div>
        </div>
    ` : '');

    document.getElementById('modal-content').innerHTML = `
        <h3 style="font-size:1.2rem;margin-bottom:1rem;color:#818cf8"><i class="fas fa-box"></i> ${s.name}</h3>
        <img src="${s.imageUrl}" style="width:100%;height:200px;object-fit:cover;border-radius:12px;margin-bottom:1rem;" onerror="this.src='https://picsum.photos/seed/${s.id}/400/200'"/>
        <div style="display:grid;gap:0.6rem;font-size:.875rem;">
            <div><span style="color:var(--text-muted)">Loại dịch vụ:</span> <b>${s.type}</b></div>
            <div><span style="color:var(--text-muted)">Đại lý:</span> <b>${s.agencyName || (s.agency?s.agency.agencyName:'')}</b></div>
            <div><span style="color:var(--text-muted)">Giá niêm yết:</span> <b style="color:#34d399">${fmtVND(s.salePrice || s.price || 0)}</b></div>
            <div><span style="color:var(--text-muted)">Mô tả:</span> <span style="display:block;margin-top:4px;color:var(--text-main)">${s.description || 'Chưa có mô tả'}</span></div>
            <div><span style="color:var(--text-muted)">Trạng thái:</span> ${s.isApproved ? '<b style="color:#34d399">Đã Phê Duyệt</b>' : '<b style="color:#fbbf24">Chờ Duyệt</b>'}</div>
        </div>
        ${tourMeta}
        <h4 style="margin-top:1.5rem;margin-bottom:.5rem"><i class="fas fa-map text-primary"></i> Hành trình / Toạ độ</h4>
        <div id="admin-map-container" style="width:100%;height:250px;border-radius:12px;background:#f1f5f9;border:1px solid #e2e8f0;overflow:hidden"></div>
    `;
    document.getElementById('detail-modal').style.display = 'flex';

    setTimeout(() => {
        if (!adminDetailMap) {
            adminDetailMap = L.map('admin-map-container').setView([11.94, 108.45], 13);
            L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=vi&gl=VN').addTo(adminDetailMap);
        } else {
            adminDetailMap.invalidateSize();
            adminDetailMap.eachLayer(l => { if (!l._url) adminDetailMap.removeLayer(l) });
        }
        
        if (s.mapPoints) {
            const arr = s.mapPoints.split('|').filter(x=>x).map(p => {
                const parts = p.split(';');
                const ll = parts[0].split(',');
                return { lat: parseFloat(ll[0]), lng: parseFloat(ll[1]), name: parts[1] || 'Điểm dừng', imgUrl: parts[2] || '', time: parts[3] || '' };
            });

            if (arr.length > 0) {
                if (arr.length === 1) {
                    L.marker([arr[0].lat, arr[0].lng]).addTo(adminDetailMap).bindPopup(`<b>${arr[0].name}</b>`);
                    adminDetailMap.setView([arr[0].lat, arr[0].lng], 15);
                } else {
                    let totalDist = 0;
                    const latLngs = arr.map(p => [p.lat, p.lng]);
                    
                    arr.forEach((p, i) => {
                        let label = `<div style="text-align:center"><b>${i + 1}. ${p.name}</b>`;
                        if (i === 0) label = `<div style="text-align:center">🚩 Bắt đầu: <b>${p.name}</b>`;
                        else if (i === arr.length - 1) label = `<div style="text-align:center">🏁 Kết thúc: <b>${p.name}</b>`;
                        
                        if (p.imgUrl) {
                            label += `<br/><img src="${p.imgUrl}" style="width:140px;height:90px;object-fit:cover;border-radius:6px;margin-top:6px;box-shadow:0 2px 4px rgba(0,0,0,.2)">`;
                        }
                        if (p.time) {
                            label += `<br/><span style="color:#f59e0b;font-size:11px;font-weight:bold;margin-top:4px;display:inline-block">⏰ Thời gian: ${p.time}</span>`;
                        }
                        label += `</div>`;
                        L.marker([p.lat, p.lng]).addTo(adminDetailMap).bindPopup(label);
                    });

                    for (let i = 0; i < arr.length - 1; i++) {
                        const dist = L.latLng(arr[i].lat, arr[i].lng).distanceTo(L.latLng(arr[i+1].lat, arr[i+1].lng));
                        totalDist += dist;
                        
                        // Chấm label km lên chính giữa đường đứt nét
                        const midLat = (arr[i].lat + arr[i+1].lat) / 2;
                        const midLng = (arr[i].lng + arr[i+1].lng) / 2;
                        const dStr = dist > 1000 ? (dist/1000).toFixed(1) + ' km' : Math.round(dist) + ' m';
                        L.marker([midLat, midLng], {
                            icon: L.divIcon({
                                className: 'dist-label-icon',
                                html: `<div style="background:#fff;color:#f43f5e;font-size:10px;padding:2px 6px;border-radius:4px;border:1px solid #f43f5e;font-weight:bold;white-space:nowrap;box-shadow:0 2px 4px rgba(0,0,0,0.2);transform:translate(-50%,-50%)">${dStr}</div>`,
                                iconSize: [0, 0]
                            }),
                            interactive: false
                        }).addTo(adminDetailMap);
                    }
                    
                    const distText = totalDist > 1000 ? (totalDist/1000).toFixed(1) + ' km' : Math.round(totalDist) + ' m';
                    
                    const line = L.polyline(latLngs, {color:'#f43f5e', weight:4, dashArray:'10'}).addTo(adminDetailMap);
                    adminDetailMap.fitBounds(line.getBounds(), {padding:[30,30]});
                    
                    // Show distance text
                    const distEl = document.createElement('div');
                    distEl.innerHTML = `<i class="fas fa-route"></i> Tổng quãng đường bay/chạy: <b style="color:#34d399">${distText}</b>`;
                    distEl.style.marginTop = '0.5rem';
                    distEl.style.marginBottom = '1rem';
                    document.getElementById('admin-map-container').insertAdjacentElement('beforebegin', distEl);
                }
            }
        }
    }, 200);
}

// ── 6. ĐẠI LÝ ────────────────────────────────────────────
async function fetchAgencies(isPreview = false) {
    try {
        const res = await fetch('/api/admin/agencies/all');
        if (!res.ok) return;
        const data = await res.json();
        window._agenciesData = data;

        if (isPreview) {
            const tBody = document.getElementById('dash-agencies-preview');
            if (tBody) {
                tBody.innerHTML = data.slice(0, 3).map(a => {
                    const badge = a.isApproved
                        ? '<span class="badge badge-success">Đã Duyệt</span>'
                        : '<span class="badge badge-warn">Chờ Duyệt</span>';
                    return `<tr><td>${a.agencyName}</td><td>${badge}</td></tr>`;
                }).join('') || '<tr><td colspan="2" class="empty-cell">Chưa có đại lý nào</td></tr>';
            }
            return;
        }

        const tbody = document.getElementById('agenciesList');
        if (!tbody) return;
        tbody.innerHTML = '';
        if (data.length === 0) {
            tbody.innerHTML = '<tr class="empty-row"><td colspan="4">Chưa có Đại Lý nào đăng ký</td></tr>';
            return;
        }
        data.forEach(a => {
            const badge = a.isApproved
                ? '<span class="badge badge-success">✔ Đã Duyệt</span>'
                : '<span class="badge badge-warn">⏳ Chờ Duyệt</span>';
            const actions = a.isApproved
                ? `<div class="action-group">
                    <button class="btn btn-sm view-btn" onclick="showAgencyDetail(${a.id})"><i class="fas fa-eye"></i> Xem</button>
                    <button class="btn btn-danger btn-sm" onclick="rejectAgency(${a.id})"><i class="fas fa-trash"></i> Xoá</button>
                   </div>`
                : `<div class="action-group">
                    <button class="btn btn-sm view-btn" onclick="showAgencyDetail(${a.id})"><i class="fas fa-eye"></i> Xem</button>
                    <button class="btn btn-success btn-sm" onclick="approveAgency(${a.id})"><i class="fas fa-check"></i> Duyệt</button>
                    <button class="btn btn-danger btn-sm" onclick="rejectAgency(${a.id})"><i class="fas fa-times"></i> Từ Chối</button>
                   </div>`;
            tbody.innerHTML += `
            <tr>
                <td><b>${a.agencyName}</b></td>
                <td>${a.licenseNumber || '—'}</td>
                <td>${badge}</td>
                <td style="text-align:right">${actions}</td>
            </tr>`;
        });
    } catch {}
}

async function approveAgency(id) {
    const res = await fetch(`/api/admin/agencies/${id}/approve`, { method: 'POST' });
    if (res.ok) { showToast('Đã phê duyệt Đại Lý!'); fetchAgencies(); }
    else showToast('Lỗi!', true);
}

async function rejectAgency(id) {
    if (!confirm('Xoá vĩnh viễn Đại Lý và toàn bộ dữ liệu liên quan?')) return;
    const res = await fetch(`/api/admin/agencies/${id}/reject`, { method: 'POST' });
    if (res.ok) { showToast('Đã xoá Đại Lý!'); fetchAgencies(); }
    else { const e = await res.json().catch(() => ({})); showToast('Lỗi: ' + (e.error || 'Thất bại'), true); }
}

function showAgencyDetail(id) {
    const a = (window._agenciesData || []).find(x => x.id === id);
    if (!a) return;
    document.getElementById('modal-content').innerHTML = `
        <h3 style="font-size:1.2rem;margin-bottom:1rem;color:#818cf8"><i class="fas fa-building"></i> ${a.agencyName}</h3>
        <div style="display:grid;gap:0.6rem;font-size:.875rem;">
            <div><span style="color:var(--text-muted)">Số Giấy phép KD:</span> <b>${a.businessLicense || 'Chưa cập nhật'}</b></div>
            <div><span style="color:var(--text-muted)">Mã số Thuế:</span> <b>${a.taxCode || '—'}</b></div>
            <div><span style="color:var(--text-muted)">Địa chỉ:</span> <b>${a.address || '—'}</b></div>
            <div><span style="color:var(--text-muted)">Trạng thái:</span> ${a.isApproved ? '<b style="color:#34d399">Đã Phê Duyệt</b>' : '<b style="color:#fbbf24">Chờ Phê Duyệt</b>'}</div>
        </div>`;
    document.getElementById('detail-modal').style.display = 'flex';
}

// ── 0. WEBSOCKET REALTIME ────────────────────────────────
let stompClient = null;

function connectWebSocket() {
    const socket = new SockJS('/ws');
    stompClient = Stomp.over(socket);
    stompClient.debug = null; // Tắt log debug cho đỡ rác console
    stompClient.connect({}, function (frame) {
        stompClient.subscribe('/topic/admin/notifications', function (msg) {
            const data = JSON.parse(msg.body);
            // Hiển thị toast thông báo
            showToast(data.message);
            // Tự động load lại bảng không cần F5
            if (data.type === 'NEW_AGENCY') fetchAgencies();
            if (data.type === 'NEW_SERVICE' || data.type === 'UPDATE_SERVICE') fetchServices();
        });
    });
}

// ── 7. KHÁCH HÀNG (USERS) ───────────────────────────────
async function fetchUsers() {
    try {
        const res = await fetch('/api/admin/users');
        if (!res.ok) return;
        const data = await res.json();
        const tbody = document.getElementById('usersList');
        if (!tbody) return;
        tbody.innerHTML = '';
        if (data.length === 0) {
            tbody.innerHTML = '<tr class="empty-row"><td colspan="4">Chưa có Khách Hàng nào đăng ký</td></tr>';
            return;
        }
        data.forEach(u => {
            const dateStr = u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : '—';
            const verifyHtml = u.isEmailVerified ? '<i class="fas fa-check-circle" style="color:#34d399" title="Đã xác minh email"></i>' : '';
            tbody.innerHTML += `
            <tr>
                <td>
                    <div style="display:flex;align-items:center;gap:.75rem">
                        <img src="${u.avatarUrl || 'https://ui-avatars.com/api/?name=' + u.username}" style="width:40px;height:40px;border-radius:50%;object-fit:cover" onerror="this.src='https://ui-avatars.com/api/?name=${u.username}'">
                        <div>
                            <b>${u.fullName || u.username}</b><br>
                            <span style="font-size:0.75rem;color:var(--text-muted)"><i class="fas fa-phone"></i> ${u.phone || '—'}</span>
                        </div>
                    </div>
                </td>
                <td>${u.email} ${verifyHtml}</td>
                <td>${dateStr}</td>
                <td style="text-align:right">
                    <button class="btn btn-danger btn-sm" onclick="deleteUser(${u.id})"><i class="fas fa-trash"></i> Xoá</button>
                </td>
            </tr>`;
        });
    } catch {}
}

async function deleteUser(id) {
    if (!confirm('Xoá vĩnh viễn Khách hàng này và toàn bộ dữ liệu của họ?')) return;
    const res = await fetch(`/api/admin/users/${id}/delete`, { method: 'POST' });
    if (res.ok) { showToast('Đã xoá Khách Hàng!'); fetchUsers(); }
    else { const e = await res.json().catch(() => ({})); showToast('Lỗi: ' + (e.error || 'Thất bại'), true); }
}

// ── 8. MODAL ─────────────────────────────────────────────
function closeModal() {
    document.getElementById('detail-modal').style.display = 'none';
}
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('detail-modal');
    if (modal) modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
});

// ── 8. API KEY CẤU HÌNH ──────────────────────────────────
async function fetchConfigs() {
    try {
        const res = await fetch('/api/admin/configs');
        const el = document.getElementById('configList');
        if (!el || !res.ok) return;
        const data = await res.json();
        el.innerHTML = data.length === 0
            ? '<div class="empty-cell">Chưa có API Key nào được thiết lập.</div>'
            : data.map(c => `
              <div class="config-item">
                  <span class="config-key">${c.configKey}</span>
                  <span class="config-val">••••••${c.configValue.slice(-4)}</span>
              </div>`).join('');
    } catch {}
}

async function saveConfig(e) {
    e.preventDefault();
    const body = new URLSearchParams({
        key:   document.getElementById('confKey').value,
        value: document.getElementById('confValue').value
    });
    const res = await fetch('/api/admin/configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
    });
    if (res.ok) { showToast('Đã lưu API Key thành công!'); e.target.reset(); fetchConfigs(); }
    else showToast('Lỗi khi lưu API Key!', true);
}

// ── 9. CHUÔNG THÔNG BÁO ────────────────────────────────────
function loadUnreadNotifications() {
    fetch('/api/notifications/unread')
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => {
        const badge = document.getElementById('unreadCount');
        const list  = document.getElementById('notifList');
        if (!badge || !list) return;

        badge.style.display = data.unreadCount > 0 ? 'inline-block' : 'none';
        if (data.unreadCount > 0) badge.innerText = data.unreadCount;

        if (data.notifications && data.notifications.length > 0) {
            list.innerHTML = data.notifications.map(n => {
                const icon = n.type === 'NEW_SERVICE'    ? 'fa-box-open' :
                             n.type === 'UPDATE_SERVICE' ? 'fa-edit' :
                             n.type === 'NEW_AGENCY'     ? 'fa-building' :
                             n.type === 'NEW_BOOKING'    ? 'fa-shopping-cart' : 'fa-bell';
                const t = n.createdAt ? new Date(n.createdAt).toLocaleString('vi-VN',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit'}) : '';
                return `<div onclick="handleNotifClick(${n.id},'${n.linkTarget || 'services'}')"
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
    document.getElementById('notifList').style.display = 'none';
    loadUnreadNotifications();
}

document.getElementById('btnNotifications').addEventListener('click', () => {
    loadUnreadNotifications();
});

// ── 10. KHỞI ĐỘNG ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    connectWebSocket();
    loadDashboard();
    fetchAgencies();
    fetchServices();
    fetchConfigs();
    if(document.getElementById('usersList')) fetchUsers();
    loadUnreadNotifications();

    // Tự động load ngay khi mới mở trang Admin
    setTimeout(() => loadAdminChart(), 300);
    
    initAdminTabs();
    setInterval(loadUnreadNotifications, 30000); // tự refresh badge mỗi 30 giây
});

function initAdminTabs() {
    document.querySelectorAll('.nav-link[data-target]').forEach(link => {
        link.addEventListener('click', () => {
            const t = link.getAttribute('data-target');
            if (t === 'dashboard') {
                setTimeout(() => loadAdminChart(), 150); // Mở lại tab là vẽ lại cho chắc
            }
            // ... (Giữ nguyên các tab khác nếu có)
        });
    });
}

let adminChartInstance = null;

async function loadAdminChart() {
    try {
        const res = await fetch('/api/admin/chart-data');
        if (!res.ok) return;
        const data = await res.json();
        
        const ctx = document.getElementById('adminRevenueChart');
        if (!ctx) return;

        if (adminChartInstance) adminChartInstance.destroy();

        adminChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'],
                datasets: [{
                    label: 'Tổng Doanh Thu Hệ Thống (VNĐ)',
                    data: data.monthlyRevenue,
                    borderColor: '#4f46e5',
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    borderWidth: 3,
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // QUAN TRỌNG: Chống lỗi 0px
                scales: { y: { beginAtZero: true } }
            }
        });
    } catch (e) { console.error("Lỗi vẽ biểu đồ Admin:", e); }
}
