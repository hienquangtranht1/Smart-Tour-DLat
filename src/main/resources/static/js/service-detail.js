document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadServiceDetails();
});

function showToast(msg, isError = false) {
    if (typeof window.showToastFunc === 'function') { window.showToastFunc(msg, isError); return; }
    const toast = document.createElement('div');
    toast.style.cssText = `position:fixed;bottom:20px;right:20px;padding:12px 24px;border-radius:8px;color:white;box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:9999;transition:opacity 0.3s;background:${isError?'#ef4444':'#10b981'}`;
    toast.innerHTML = `<div style="display:flex;align-items:center;gap:8px;"><i class="fas ${isError ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i> <span>${msg}</span></div>`;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3000);
}

let currentService = null;
let mapInstance = null;

function checkAuth() {
    fetch('/api/auth/profile')
        .then(res => {
            if (res.ok) {
                return res.json();
            }
            throw new Error('Not logged in');
        })
        .then(user => {
            document.getElementById('userDisplayName').innerText = (user.fullName || user.username) + ' ▼';
        })
        .catch(() => {
            // Không đăng nhập cũng có thể xem, nhưng không thể thao tác đặt hoặc Review
            document.getElementById('userDisplayName').innerText = 'Chưa đăng nhập ▼';
        });
}

function loadServiceDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const serviceId = urlParams.get('id');
    
    if (!serviceId) {
        document.getElementById('serviceDetailContainer').innerHTML = `
            <div class="glass-panel" style="padding: 3rem; text-align: center;">
                <h2>Không tìm thấy dịch vụ</h2>
                <a href="index.html" class="btn btn-primary mt-4">Quay lại trang chủ</a>
            </div>
        `;
        return;
    }

    fetch(`/api/user/services/${serviceId}`)
        .then(res => {
            if(!res.ok) throw new Error('Service not found');
            return res.json();
        })
        .then(service => {
            currentService = service;
            renderService(service);
            loadReviews(serviceId);
        })
        .catch(err => {
            console.error(err);
            document.getElementById('serviceDetailContainer').innerHTML = `
                <div class="glass-panel" style="padding: 3rem; text-align: center;">
                    <h2>Lỗi: Không tìm thấy dịch vụ</h2>
                    <a href="index.html" class="btn btn-primary mt-4">Quay lại trang chủ</a>
                </div>
            `;
        });
}

function renderService(service) {
    let typeHtml = '';
    if (service.serviceType === 'TOUR') typeHtml = '<span class="badge" style="background:#818cf8">Nổi bật – Tour trọn gói</span>';
    else if (service.serviceType === 'HOTEL') typeHtml = '<span class="badge" style="background:#34d399">Khách sạn / Villa</span>';
    else if (service.serviceType === 'RESTAURANT') typeHtml = '<span class="badge" style="background:#fbbf24">Nhà hàng / Món ngon</span>';
    else if (service.serviceType === 'CAFE') typeHtml = '<span class="badge" style="background:#f43f5e">Cafe / Check-in</span>';

    const priceHtml = `
        <div style="font-size:1.8rem;font-weight:800;color:#10b981;margin-bottom:.5rem">
            ${service.salePrice.toLocaleString()} ₫
        </div>
        ${
            service.salePrice < service.originalPrice
            ? `<div style="text-decoration:line-through;color:#64748b;font-size:1.1rem;margin-bottom:1.5rem">
                    ${service.originalPrice.toLocaleString()} ₫
               </div>`
            : '<div style="margin-bottom:1.5rem"></div>'
        }
    `;

    document.getElementById('serviceDetailContainer').innerHTML = `
        <div class="detail-hero animate-fade-in">
            <img src="${service.imageUrl || 'https://via.placeholder.com/1200x400?text=Service'}" alt="Service Image" class="detail-img">
            <div class="detail-overlay">
                <div style="width: 100%">
                    <div style="margin-bottom: 0.8rem;">${typeHtml}</div>
                    <h1 style="font-size: 2.2rem; margin-bottom: 0.5rem; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">${service.serviceName}</h1>
                    <p style="color: #cbd5e1;"><i class="fas fa-building text-primary"></i> ${service.agencyName}</p>
                </div>
            </div>
        </div>
        
        <div class="detail-info animate-fade-in" style="animation-delay: 0.1s;">
            <!-- Cột trái: Chi tiết & Bản đồ -->
            <div>
                <div class="glass-panel" style="padding: 2rem; margin-bottom: 2rem; background: #fff; color: #1e293b; border: 1px solid #e2e8f0;">
                    <h3 style="margin-bottom: 1rem;"><i class="fas fa-info-circle text-primary"></i> Chi tiết dịch vụ</h3>
                    <div style="line-height: 1.8; color: #334155; white-space: pre-line;">
                        ${service.description || 'Chưa có thông tin mô tả chi tiết'}
                    </div>
                </div>

                <div class="glass-panel" style="padding: 2rem; margin-bottom: 2rem; background: #fff; color: #1e293b; border: 1px solid #e2e8f0;">
                    <h3 style="margin-bottom: 1rem;"><i class="fas fa-map-marker-alt text-secondary"></i> Vị trí / Bản đồ</h3>
                    <div id="serviceMap" style="height: 300px; border-radius: 12px; background: #f1f5f9;"></div>
                </div>
                
                <div class="glass-panel" style="padding: 2rem; background: #fff; color: #1e293b; border: 1px solid #e2e8f0;">
                    <h3 style="margin-bottom: 1.5rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem;">
                        <i class="fas fa-star text-warning"></i> Đánh giá & Báo cáo
                    </h3>
                    
                    <div id="reviewList" style="margin-bottom: 2rem;">
                        <div style="text-align:center; padding:1rem;"><i class="fas fa-spinner fa-spin"></i> Đang tải đánh giá...</div>
                    </div>
                    
                    <div style="background: #f8fafc; padding: 1.5rem; border-radius: 12px; border: 1px solid #e2e8f0; color: #1e293b;">
                        <h4 style="margin-bottom: 1rem;">Viết đánh giá hoặc báo cáo</h4>
                        <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
                            <label><input type="radio" name="reviewType" value="REVIEW" checked onchange="toggleRatingInput(true)"> Đánh giá</label>
                            <label><input type="radio" name="reviewType" value="REPORT" onchange="toggleRatingInput(false)"> Báo cáo vi phạm</label>
                        </div>
                        <div id="ratingInputContainer" style="margin-bottom: 1rem;">
                            <select id="reviewRating" class="input-glass" style="width: auto; background: #fff; color: #1e293b; border: 1px solid #cbd5e1;">
                                <option value="5">5 Sao ⭐⭐⭐⭐⭐</option>
                                <option value="4">4 Sao ⭐⭐⭐⭐</option>
                                <option value="3">3 Sao ⭐⭐⭐</option>
                                <option value="2">2 Sao ⭐⭐</option>
                                <option value="1">1 Sao ⭐</option>
                            </select>
                        </div>
                        <textarea id="reviewContent" class="input-glass" rows="4" placeholder="Nhập nội dung của bạn..." style="margin-bottom: 1rem; width: 100%; background: #fff; color: #1e293b; border: 1px solid #cbd5e1;"></textarea>
                        <button class="btn btn-primary" onclick="submitReview()"><i class="fas fa-paper-plane"></i> Gửi nội dung</button>
                    </div>
                </div>
            </div>
            
            <!-- Cột phải: Giá cả, Thông tin phụ & Thanh toán -->
            <div>
                <div class="glass-panel" style="padding: 2rem; position: sticky; top: 1rem; background: #fff; color: #1e293b; border: 1px solid #e2e8f0;">
                    ${priceHtml}
                    
                    <div style="display: flex; flex-direction: column; gap: 0.8rem; margin-bottom: 2rem; padding: 1rem; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
                        ${service.maxPeople ? `<div><i class="fas fa-users text-primary"></i> <span style="color:#64748b">Sức chứa:</span> <b>${service.maxPeople} người</b></div>` : ''}
                        ${service.durationDays ? `<div><i class="fas fa-clock text-primary"></i> <span style="color:#64748b">Thời lượng:</span> <b>${service.durationDays} Ngày</b></div>` : ''}
                        ${service.openingTime ? `<div><i class="fas fa-door-open text-primary"></i> <span style="color:#64748b">Giờ mở cửa:</span> <b>${service.openingTime} - ${service.closingTime}</b></div>` : ''}
                        ${service.availableRooms ? `<div><i class="fas fa-bed text-primary"></i> <span style="color:#64748b">Phòng trống:</span> <b>${service.availableRooms}</b></div>` : ''}
                    </div>
                    
                    <button class="btn" style="width: 100%; padding: 1rem; font-size: 1.1rem; background: linear-gradient(135deg, #f43f5e, #fb923c); color: white; border: none;" onclick="openBookingModal()">
                        <i class="fas fa-bolt"></i> Đặt Ngay
                    </button>
                </div>
            </div>
        </div>
    `;

    // Khởi tạo bản đồ nếu có mapPoints
    if (service.mapPoints) {
        initMap(service);
    } else {
        document.getElementById('serviceMap').innerHTML = '<div style="padding:2rem;text-align:center;color:#64748b">Không có thông tin tọa độ.</div>';
    }
}

function initMap(service) {
    try {
        setTimeout(() => {
            if (mapInstance) {
                mapInstance.remove();
            }
            
            const pointsStr = service.mapPoints || "";
            const pointBlocks = pointsStr.split('|');
            
            const markersData = [];
            
            pointBlocks.forEach(block => {
                const parts = block.split(';');
                if (parts.length > 0 && parts[0].includes(',')) {
                    const coords = parts[0].split(',');
                    const lat = parseFloat(coords[0].trim());
                    const lng = parseFloat(coords[1].trim());
                    if (!isNaN(lat) && !isNaN(lng)) {
                        markersData.push({
                            lat: lat,
                            lng: lng,
                            name: parts.length > 1 && parts[1] ? parts[1] : service.serviceName,
                            image: parts.length > 2 && parts[2] ? parts[2] : '',
                            time: parts.length > 3 && parts[3] ? parts[3] : ''
                        });
                    }
                }
            });

            if (markersData.length === 0) {
                // Fallback Dalat center
                mapInstance = L.map('serviceMap').setView([11.940419, 108.458313], 13);
                if (typeof addVietnamSovereignty === 'function') addVietnamSovereignty(mapInstance);
                L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=vi&gl=VN', { attribution: '&copy; Bản đồ Chủ Quyền VN (Google Maps)' }).addTo(mapInstance);
                return;
            }

            mapInstance = L.map('serviceMap');
            if (typeof addVietnamSovereignty === 'function') addVietnamSovereignty(mapInstance);
            L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=vi&gl=VN', {
                attribution: '&copy; Bản đồ Chủ Quyền Việt Nam (Google Maps Tiled)'
            }).addTo(mapInstance);

            const defaultIcon = L.divIcon({
                className: 'custom-div-icon',
                html: `<div style="background-color: #3b82f6; width: 1.5rem; height: 1.5rem; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            });

            const latlngs = [];
            markersData.forEach((m, idx) => {
                latlngs.push([m.lat, m.lng]);
                
                const numberedIcon = L.divIcon({
                    className: 'custom-div-icon',
                    html: `<div style="background-color: ${idx===0 ? '#22c55e' : (idx===markersData.length-1 ? '#ef4444' : '#3b82f6')}; width: 1.5rem; height: 1.5rem; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 0.75rem;">${idx+1}</div>`,
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                });
                
                let popupHtml = `<div style="padding: 5px; min-width: 150px; text-align: center; color: #1e293b;">`;
                popupHtml += `<strong style="color: #3b82f6; font-size: 14px;">${m.name}</strong><br>`;
                if (m.time && m.time !== 'undefined' && m.time.trim() !== '') popupHtml += `<div style="font-size: 12px; color: #64748b; margin-top: 4px;"><i class="fas fa-clock"></i> ${m.time}</div>`;
                if (m.image && m.image !== 'undefined' && m.image.trim() !== '') popupHtml += `<img src="${m.image}" style="width: 100%; height: 80px; object-fit: cover; border-radius: 6px; margin-top: 8px;">`;
                popupHtml += `</div>`;

                L.marker([m.lat, m.lng], {icon: service.serviceType === 'TOUR' ? numberedIcon : defaultIcon}).addTo(mapInstance)
                    .bindPopup(popupHtml);
            });

            if (service.serviceType === 'TOUR' && latlngs.length > 1) {
                L.polyline(latlngs, {color: '#f43f5e', weight: 4, dashArray: '8,10'}).addTo(mapInstance);
            }

            if (latlngs.length === 1) {
                mapInstance.setView(latlngs[0], 14);
            } else {
                mapInstance.fitBounds(L.latLngBounds(latlngs), {padding: [30, 30]});
            }

        }, 300);
    } catch (e) {
        console.error("Lỗi khởi tạo bản đồ", e);
    }
}

function toggleRatingInput(show) {
    document.getElementById('ratingInputContainer').style.display = show ? 'block' : 'none';
}

function loadReviews(serviceId) {
    fetch(`/api/reviews/service/${serviceId}`)
        .then(res => res.json())
        .then(reviews => {
            const container = document.getElementById('reviewList');
            if (!reviews || reviews.length === 0) {
                container.innerHTML = '<div style="color: #64748b; padding: 1rem 0;">Chưa có đánh giá nào cho dịch vụ này. Hãy là người đầu tiên!</div>';
                return;
            }

            container.innerHTML = reviews.map(r => {
                let starsHtml = '';
                if (r.type === 'REVIEW' && r.rating) {
                    starsHtml = '<span class="stars">' + '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating) + '</span>';
                } else if (r.type === 'REPORT') {
                    starsHtml = '<span class="badge" style="background:#ef4444; font-size: 0.7rem; padding: 2px 6px;">Báo cáo</span>';
                }

                // Format DateTime
                let dateStr = r.createdAt;
                try {
                    const d = new Date(r.createdAt);
                    if(!isNaN(d)) {
                        dateStr = d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'});
                    }
                } catch(e) {}

                return `
                    <div class="review-card">
                        <div class="review-header">
                            <div class="reviewer-info">
                                <img src="${r.userAvatar || 'https://via.placeholder.com/40'}" alt="avt" class="reviewer-avatar">
                                <div>
                                    <div style="font-weight: 700;">${r.userName}</div>
                                    <div style="font-size: 0.75rem; color: #94a3b8;">${dateStr}</div>
                                </div>
                            </div>
                            <div>${starsHtml}</div>
                        </div>
                        <div style="color: #334155; line-height: 1.5; font-size: 0.95rem;">
                            ${r.content}
                        </div>
                    </div>
                `;
            }).join('');
        })
        .catch(err => {
            document.getElementById('reviewList').innerHTML = '<div style="color: #ef4444;">Lỗi khi tải đánh giá.</div>';
        });
}

function submitReview() {
    if (!currentService) return;
    
    const type = document.querySelector('input[name="reviewType"]:checked').value;
    const rating = document.getElementById('reviewRating').value;
    const content = document.getElementById('reviewContent').value.trim();
    
    if (!content) {
        showToast('Vui lòng nhập nội dung!', true);
        return;
    }

    const formData = new URLSearchParams();
    formData.append('serviceId', currentService.id);
    formData.append('type', type);
    formData.append('content', content);
    if (type === 'REVIEW') {
        formData.append('rating', rating);
    }

    fetch('/api/reviews', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData.toString()
    })
    .then(async res => {
        const body = await res.json();
        if (res.ok) {
            showToast(body.message);
            document.getElementById('reviewContent').value = '';
        } else {
            showToast(body.message || 'Lỗi gửi đánh giá', true);
            // Có thể do chưa đăng nhập
            if (res.status === 401) {
                setTimeout(() => window.location.href = 'login.html', 1500);
            }
        }
    })
    .catch(err => {
        showToast('Lỗi mạng kết nối!', true);
    });
}

// Giữ lại logic Booking nguyên vẹn từ Modal cũ ở User.html
function openBookingModal() {
    if (!currentService) return;
    
    // Check role from API? We can just redirect to index if unauth via booking fail, but let's assume valid.
    const service = currentService;
    let qtyLabel = service.serviceType === 'HOTEL' ? 'Số lượng phòng' : 'Số lượng khách';
    let maxLabel = service.serviceType === 'HOTEL' ? `(${service.availableRooms} phòng trống)` : `(Nhận ${service.maxPeople || 0} khách)`;
    let html = `
        <div style="background:#fff; color:#333; padding:2rem; border-radius:16px; width:450px; max-width:90vw;">
            <h3 style="margin-bottom:1rem; color:#1e293b; border-bottom:1px solid #e2e8f0; padding-bottom:.5rem;">Xác nhận đặt: <span style="color:var(--primary)">${service.serviceName}</span></h3>
            
            <div style="display:flex; flex-direction:column; gap:1rem; margin-bottom:1.5rem;">
                <!-- Ngày nhận phòng / Đi tour -->
                <div style="display:flex; flex-direction:column; gap:5px;">
                    <label style="font-weight:600; font-size:0.9rem;">Ngày ${service.serviceType==='HOTEL' ? 'nhận phòng (Check-in)' : 'khởi hành Tour'} <span style="color:red">*</span></label>
                    <input type="date" id="bookDate" class="input-glass" style="background:#f8fafc; color:#333; border:1px solid #cbd5e1;" required>
                </div>
                
                ${service.serviceType === 'HOTEL' ? `
                    <div style="display:flex; flex-direction:column; gap:5px;">
                        <label style="font-weight:600; font-size:0.9rem;">Số đêm thuê <span style="color:red">*</span></label>
                        <input type="number" id="bookDays" class="input-glass" style="background:#f8fafc; color:#333; border:1px solid #cbd5e1;" value="1" min="1" required>
                    </div>
                ` : `
                    <div style="display:flex; flex-direction:column; gap:5px;">
                        <label style="font-weight:600; font-size:0.9rem;">Khung giờ đón (Tham khảo)</label>
                        <input type="time" id="bookTime" class="input-glass" style="background:#f8fafc; color:#333; border:1px solid #cbd5e1;">
                    </div>
                `}

                <div style="display:flex; flex-direction:column; gap:5px;">
                    <label style="font-weight:600; font-size:0.9rem;">${qtyLabel} <span style="color:red">*</span> <small style="font-weight:normal; color:#64748b;">${maxLabel}</small></label>
                    <input type="number" id="bookQty" class="input-glass" style="background:#f8fafc; color:#333; border:1px solid #cbd5e1;" value="1" min="1" required>
                </div>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:1rem;">
                <button class="btn btn-secondary" onclick="document.getElementById('bookingModal').style.display='none'">Hủy</button>
                <button class="btn btn-primary" onclick="confirmBookService(${service.id})"><i class="fas fa-check"></i> Xác nhận Đặt</button>
            </div>
        </div>
    `;
    
    document.getElementById('bookingModal').innerHTML = html;
    document.getElementById('bookingModal').style.display = 'flex';
    
    // Set default min date to today
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    const localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, 10);
    document.getElementById('bookDate').min = localISOTime;
    document.getElementById('bookDate').value = localISOTime;
}

function confirmBookService(serviceId) {
    const applyDateStr = document.getElementById('bookDate').value;
    const quantity = document.getElementById('bookQty').value;
    
    // Thu thập thêm ngày thuê & giờ nếu có
    const bTimeEl = document.getElementById('bookTime');
    const bDaysEl = document.getElementById('bookDays');
    
    let timeStr = "";
    let daysStr = "";
    
    if (bTimeEl) timeStr = bTimeEl.value; // Dành cho tour
    if (bDaysEl) daysStr = bDaysEl.value; // Dành cho Hotel

    if (!applyDateStr || !quantity || quantity < 1) {
        showToast('Vui lòng nhập Ngày hợp lệ và Số lượng tối thiểu là 1!', true);
        return;
    }
    if (bDaysEl && (!daysStr || daysStr < 1)) {
        showToast('Vui lòng nhập số đêm thuê tối thiểu là 1!', true);
        return;
    }

    const formData = new URLSearchParams();
    formData.append('quantity', quantity);
    formData.append('bookingDate', applyDateStr);
    
    if (timeStr) formData.append('bookingTime', timeStr);
    if (daysStr) formData.append('bookingDays', daysStr);

    fetch(`/api/user/book/${serviceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
    })
    .then(async res => {
        const body = await res.json().catch(e => ({}));
        if (res.ok) {
            document.getElementById('bookingModal').style.display = 'none';
            showToast('🎉 Đặt hàng thành công! Vui lòng chuyển thẻ để thanh toán.');
            setTimeout(() => {
                window.location.href = 'index.html'; // Tới trang chủ kèm tab history?
            }, 1500);
        } else {
            showToast(body.message || body.error || 'Lỗi đặt dịch vụ', true);
            if(res.status === 401) {
                setTimeout(() => window.location.href = 'login.html', 1500);
            }
        }
    })
    .catch(err => {
        showToast('Lỗi mạng', true);
        console.error(err);
    });
}
