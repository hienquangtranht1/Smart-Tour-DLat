document.addEventListener('DOMContentLoaded', () => {
    
    // Tab Switching Logic
    window.initTabs = function() {
        const tabLinks = document.querySelectorAll('.nav-link[data-target]');
        const tabContents = document.querySelectorAll('.tab-content');

        tabLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Remove active classes
                tabLinks.forEach(l => l.classList.remove('active'));
                tabContents.forEach(c => {
                    c.style.display = 'none';
                    c.classList.remove('animate-fade-in');
                });

                // Add active class
                link.classList.add('active');
                const targetId = link.getAttribute('data-target');
                const targetContent = document.getElementById(targetId);
                
                if (targetContent) {
                    targetContent.style.display = 'block';
                    // Re-trigger animation
                    void targetContent.offsetWidth; 
                    targetContent.classList.add('animate-fade-in');
                    
                    // Trigger map resize if open Map tab (User form only)
                    if (targetId === 'map' && window.explorerMap) {
                        setTimeout(() => {
                            window.explorerMap.invalidateSize();
                            if (typeof explorerMapGroup !== 'undefined' && explorerMapGroup.getBounds().isValid()) {
                                window.explorerMap.fitBounds(explorerMapGroup.getBounds(), {padding: [30,30]});
                            }
                        }, 250);
                    }
                }
            });
        });
    };

    // Auto init tabs if any exist
    window.initTabs();
});

// Mock notification
function showNotification(msg) {
    const notif = document.createElement('div');
    notif.className = 'glass-panel p-4 flex items-center gap-3 animate-fade-in';
    notif.style.position = 'fixed';
    notif.style.bottom = '20px';
    notif.style.right = '20px';
    notif.style.zIndex = '9999';
    notif.style.borderLeft = '4px solid #10b981';
    
    notif.innerHTML = `
        <i class="fas fa-check-circle" style="color: #10b981; font-size: 1.5rem;"></i>
        <div>
            <h4 style="font-size: 14px; margin-bottom: 2px;">Thành công</h4>
            <p class="text-sm">${msg}</p>
        </div>
    `;
    
    document.body.appendChild(notif);
    
    setTimeout(() => {
        notif.style.opacity = '0';
        notif.style.transform = 'translateY(20px)';
        notif.style.transition = 'all 0.5s ease';
        setTimeout(() => notif.remove(), 500);
    }, 3000);
}

// Hàm đánh dấu chủ quyền Quần đảo Hoàng Sa và Trường Sa trên tất cả các instance Leaflet Map
window.addVietnamSovereignty = function(map) {
    if (!map || typeof L === 'undefined') return;
    
    // Quần đảo Hoàng Sa (16.4, 112.0)
    const hsIcon = L.divIcon({
        className: 'vn-sovereignty-label',
        html: '<div style="color:#dc2626;font-weight:800;text-transform:uppercase;text-shadow:1px 1px 2px #fff, -1px -1px 2px #fff, 1px -1px 2px #fff, -1px 1px 2px #fff, 0px 0px 4px rgba(255,255,255,0.8);font-size:11px;white-space:nowrap;letter-spacing:0.5px;">⭐ Quần đảo Hoàng Sa (Việt Nam)</div>',
        iconSize: [200, 20],
        iconAnchor: [100, 10]
    });
    
    // Quần đảo Trường Sa (10.0, 114.0)
    const tsIcon = L.divIcon({
        className: 'vn-sovereignty-label',
        html: '<div style="color:#dc2626;font-weight:800;text-transform:uppercase;text-shadow:1px 1px 2px #fff, -1px -1px 2px #fff, 1px -1px 2px #fff, -1px 1px 2px #fff, 0px 0px 4px rgba(255,255,255,0.8);font-size:11px;white-space:nowrap;letter-spacing:0.5px;">⭐ Quần đảo Trường Sa (Việt Nam)</div>',
        iconSize: [200, 20],
        iconAnchor: [100, 10]
    });

    L.marker([16.4, 112.0], {icon: hsIcon, interactive: false, zIndexOffset: 1000}).addTo(map);
    L.marker([10.0, 114.0], {icon: tsIcon, interactive: false, zIndexOffset: 1000}).addTo(map);
};

// ── Hàm đăng xuất toàn cục (GET Redirect) ──
window.doLogoutUser = async function(e) {
    if (e) e.preventDefault();
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/api/auth/logout';
};
