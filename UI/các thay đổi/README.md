# 🏗 SmartTour 2026 Technical Specs & Migration Guide

Tài liệu này cung cấp các chỉ số kỹ thuật và hướng dẫn đồng bộ cho dự án SmartTour (Spring Boot + React Architecture). Được tối ưu để các nhà phát triển và Công cụ AI (như Antigravity) có thể hiểu và áp dụng ngay.

---

## 🧭 1. Architectural Contract (Hợp đồng Kiến trúc)

### Core Integration:
- **Routing**: Phải sử dụng `HashRouter` thay cho `BrowserRouter` để tương thích với cơ chế Serving Static của Spring Boot khi deploy trên domain (fix lỗi 404 Refresh).
- **Backend-Frontend Bridge**: Code React sau khi build (`dist`) được đẩy vào `src/main/resources/static`. Endpoint mặc định là `http://localhost:8080`.

---

## 🛠 2. Component Structure (Cấu trúc Thành phần)

Mã nguồn mới áp dụng mô hình **Atomic Design** & **Custom Hook** để tối ưu hóa việc tái sử dụng:

| Component / Hook | Chức năng (v2.0) | Dependency |
| :--- | :--- | :--- |
| `useHome.ts` | Quản lý logic fetch dịch vụ & Navigation liên kết Marketplace. | `useNavigate` |
| `BrandingSidebar.tsx`| UI Branding với Floating Blobs & entrance animations. | `motion` (motion/react) |
| `useMarketplace.ts` | Tự động bắt `id` từ URL params để trigger xem chi tiết dịch vụ & xử lý booking. | `useSearchParams`, `useAuth` |
| `Auth.tsx` | Trang Login/Register chuyên sâu với cơ chế OTP & Phân quyền. | `useAuth`, `lucide-react` |
| `PDFService.ts` | Xử lý xuất file PDF độc lập, cách ly các biến CSS `oklch`. | `html2pdf.js` |

---

## 🔗 3. API & Data Model Sync (Đồng bộ Dữ liệu)

Để Giao diện React hiển thị đầy đủ thông tin chi tiết đơn hàng, Backend DTO phải cung cấp các trường sau:

- **Endpoint**: `GET /api/user/orders`
- **Frontend Contract (Interface Order)**:
  - `endDate`: Ngày kết thúc (Tính bằng `applyDate` + `durationDays` hoặc `bookingDays`).
  - `bookingTime`: Giờ đến (Format: `HH:mm`).
  - `bookingDays`: Thời gian thuê (Số lượng đêm cho Hotel).
  - `quantity`: Số lượng đơn vị đặt (Phòng/Vé/Bàn).

> [!IMPORTANT]
> File **`UserController.java`** trong thư mục `backend/controller` đã được cập nhật logic tính toán `endDate` tự động theo loại dịch vụ (Tour/Hotel).

---

## 🚀 4. Deployment Instructions (Cho Developer/AI)

1. **Install Dependencies**:
   - `npm install motion` (cho các hiệu ứng Branding mới).
   - `npm install lucide-react` (iconography).

2. **Sync Frontend code**:
   - **Ghi đè** nội dung thư mục `client` hiện tại bằng nội dung trong thư mục này. 
   - Đảm bảo các thư mục `contexts` và `components` đã được đồng bộ đầy đủ để tránh lỗi "Module not found".
   - Kiểm tra `client/app/routes.tsx` để đảm bảo `HashRouter` đã được active.

3. **Backend Sync**:
   - Copy `UserController.java` vào `com.dalat.nhom6.chieuthu5.smarttour.controller`.
   - Copy `OrderRepository.java` vào `com.dalat.nhom6.chieuthu5.smarttour.repository`.

4. **Execute Build**:
   - `npm run deploy` (Vite build -> Spring Boot static).
   - Clean compile & Run Spring Boot.

---
**Technical Note for AI Assistants:**
- If you encounter 404 errors on sub-routes, ensure user is using `HashRouter`.
- The `BrandingSidebar` depends on `motion` package. If missing, UI will break.
- `PDFService.ts` handles CSS isolation to prevent build-time CSS errors.
