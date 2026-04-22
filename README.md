<div align="center">


  <h1>🌲 Smart Tour Đà Lạt 🌲</h1>
  
  **Nền tảng Du lịch Thông minh Tích hợp Trí tuệ Nhân tạo & Thanh toán Điện tử**

  <p>
    <a href="https://spring.io/projects/spring-boot"><img src="https://img.shields.io/badge/Spring%20Boot-3.x-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white" alt="Spring Boot"/></a>
    <a href="https://www.java.com/"><img src="https://img.shields.io/badge/Java-17-ED8B00?style=for-the-badge&logo=java&logoColor=white" alt="Java"/></a>
    <a href="https://www.mysql.com/"><img src="https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL"/></a>
    <a href="https://www.docker.com/"><img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker"/></a>
    <img src="https://img.shields.io/badge/VNPay-Gateway-red?style=for-the-badge" alt="VNPay"/>
  </p>

  <p>
    <a href="#-giới-thiệu">Giới thiệu</a> •
    <a href="#-tính-năng-cốt-lõi">Tính năng</a> •
    <a href="#-công-nghệ-sử-dụng">Công nghệ</a> •
    <a href="#-hướng-dẫn-cài-đặt">Cài đặt</a> •
    <a href="#-tài-liệu-kiến-trúc">Kiến trúc</a>
  </p>

</div>

---

## 📖 Giới thiệu

> **Smart Tour Da Lat** không chỉ là một trang web đặt dịch vụ du lịch thông thường. Đây là một hệ sinh thái số hóa toàn diện dành cho "Thành phố ngàn hoa", kết nối trực tiếp Khách du lịch, Đại lý cung cấp dịch vụ và Nhà quản lý. Đặc biệt, ứng dụng tiên phong ứng dụng **Trí tuệ nhân tạo (AI)** để tự động thiết kế các lịch trình cá nhân hóa, mang lại trải nghiệm du lịch liền mạch, thông minh và tối ưu chi phí.


---

## ✨ Tính năng Nổi bật

Hệ thống được phân quyền chặt chẽ, cung cấp các luồng nghiệp vụ chuyên sâu cho 4 đối tượng người dùng:

### 🤖 1. Lõi Công Nghệ (Core Engine)
* **AI Itinerary Generator:** Thuật toán AI tự động phân tích (Sở thích, Ngân sách, Số ngày) để sinh ra lịch trình du lịch Đà Lạt tối ưu về mặt địa lý và thời gian.
* **Payment Gateway:** Tích hợp **VNPay SDK**, tự động xử lý thanh toán, callback trạng thái và sinh mã giao dịch an toàn.
* **Real-time WebSocket:** Sử dụng giao thức STOMP để đẩy thông báo đẩy (Push Notifications) ngay lập tức khi có đơn hàng mới hoặc thay đổi trạng thái.

### 🎒 2. Khách Du Lịch (User)
* Tìm kiếm, lọc và đánh giá (Review/Rating) các dịch vụ: Khách sạn, Homestay, Quán Cafe, Tour du lịch.
* Đặt dịch vụ, thanh toán online và nhận vé/lịch trình điện tử qua **Email (Kèm mã QR/PDF)**.
* Quản lý hồ sơ cá nhân với hệ thống xác thực bảo mật 2 lớp qua **Mã OTP**.

### 🏢 3. Đại Lý (Agency)
* Cổng thông tin riêng biệt để đăng ký bán chéo dịch vụ của mình trên nền tảng.
* Quản lý kho phòng, số lượng vé tour và theo dõi trạng thái đơn đặt hàng.
* Theo dõi **Hoa hồng (Commissions)** tự động đối soát từ hệ thống.

### 🛡️ 4. Quản trị & Nhân viên (Admin / Staff)
* **Dashboard thống kê:** Trực quan hóa doanh thu, tốc độ tăng trưởng và dịch vụ bán chạy.
* Kiểm duyệt Đại lý mới và phê duyệt các dịch vụ trước khi hiển thị cho người dùng.
* Xử lý khiếu nại, hoàn tiền và quản lý cấu hình hệ thống (`SystemConfig`).

---

## 🛠️ Công nghệ Sử dụng

Dự án áp dụng mô hình kiến trúc MVC kết hợp các Design Pattern hiện đại, đảm bảo tính mở rộng và dễ bảo trì:

| Lớp (Layer) | Công nghệ / Thư viện | Vai trò cốt lõi |
| :--- | :--- | :--- |
| **Backend Core** | `Java 17`, `Spring Boot 3.x` | Xử lý logic nghiệp vụ, bảo mật, RestAPI |
| **Database & ORM** | `MySQL 8.x`, `Spring Data JPA`, `Hibernate` | Lưu trữ dữ liệu, ánh xạ Object-Relational |
| **Security & Auth** | `AuthFilter`, `JWT/Session`, `Bcrypt` | Phân quyền, mã hóa mật khẩu, kiểm soát truy cập |
| **Integration** | `VNPay SDK`, `JavaMailSender`, `Spring WebSocket` | Thanh toán trực tuyến, Gửi Email, Real-time |
| **Frontend** | `HTML5`, `CSS3`, `TypeScript`,`Vanilla JS`, `AJAX` | Giao diện người dùng tương tác, Responsive |
| **DevOps** | `Docker`, `Docker Compose`, `Maven` | Đóng gói, Container hóa, Triển khai nhanh gọn |

---

## 📂 Kiến trúc & Cấu trúc Dự án

Dự án tuân thủ nghiêm ngặt cấu trúc gói (package) chuẩn của một ứng dụng Spring Boot Enterprise:

```text
📦 smart-tour-dlat
 ┣ 📂 src/main/java/com/dalat/hien/tqh/smarttour
 ┃ ┣ 📂 config          # Cấu hình Bean: VNPay, WebSocket, CorsConfig, Schedule...
 ┃ ┣ 📂 controller      # Các lớp API và View Controller điều hướng requests
 ┃ ┣ 📂 entity          # Lớp mô hình hóa dữ liệu (User, Tour, Order, Itinerary...)
 ┃ ┣ 📂 repository      # Các Interface giao tiếp CSDL (Spring Data JPA)
 ┃ ┣ 📂 service         # Chứa Logic nghiệp vụ phức tạp (AI, Payment, Email, OTP)
 ┃ ┣ 📂 filter          # Bộ lọc bảo mật (AuthFilter chặn request không hợp lệ)
 ┃ ┣ 📂 job             # Các tiến trình chạy ngầm (Cron Jobs - VD: Hủy đơn quá hạn)
 ┃ ┗ 📜 SmarttourApplication.java # Lớp khởi động ứng dụng
 ┣ 📂 src/main/resources
 ┃ ┣ 📂 static          # Tài nguyên Public (CSS, JS, Fonts, Images)
 ┃ ┃ ┣ 📜 index.html    # Trang chủ người dùng
 ┃ ┃ ┣ 📜 admin.html    # Giao diện Quản trị viên
 ┃ ┃ ┗ ...
 ┃ ┗ 📜 application.properties # Biến môi trường, cấu hình Server & CSDL
 ┣ 📜 docker-compose.yml # Tệp tin dựng môi trường cục bộ (App + MySQL)
 ┣ 📜 pom.xml            # Quản lý dependency Maven
 ┗ 📜 smarttour_db.sql   # Kịch bản DDL/DML khởi tạo Database mẫu
```

## 🚀 Hướng dẫn Cài đặt

Chỉ với vài thao tác cơ bản, bạn có thể chạy toàn bộ hệ thống ngay trên máy tính cá nhân.

Yêu cầu tiên quyết

Java JDK 17+

Maven 3.6+

Docker Desktop (Khuyên dùng) hoặc MySQL Server local.

Phương pháp 1: Khởi chạy bằng Docker (Siêu nhanh ⚡)

Đây là cách dễ nhất để chạy dự án mà không cần cài đặt CSDL thủ công.

Bash

1. Clone dự án về máy
git clone [https://github.com/your-username/smart-tour-dlat.git](https://github.com/your-username/smart-tour-dlat.git)
cd smart-tour-dlat

2. Build và khởi chạy các container (App và DB)
docker-compose up -d --build

Hệ thống sẽ tự động khởi tạo MySQL, chạy file smarttour_db.sql và khởi động Server tại http://localhost:8080.

Phương pháp 2: Chạy thủ công (Dành cho Developer 💻)

Mở MySQL và tạo Database: CREATE DATABASE smarttour_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

Import dữ liệu ban đầu từ file smarttour_db.sql.

Mở file src/main/resources/application.properties và sửa thông tin kết nối CSDL:

Properties

spring.datasource.url=jdbc:mysql://localhost:3306/smarttour_db?useSSL=false

spring.datasource.username=root

spring.datasource.password=mat_khau_cua_ban

Build và chạy ứng dụng bằng Maven Wrapper:

Bash
./mvnw clean package -DskipTests
java -jar target/smarttour-0.0.1-SNAPSHOT.jar

## 🗺️ Định hướng Phát triển (Roadmap)
[x] Tích hợp thanh toán trực tuyến (VNPay).

[x] Triển khai hệ thống thông báo Real-time (WebSocket).

[x] Tích hợp AI gợi ý lịch trình.

[ ] Bổ sung tính năng Đa ngôn ngữ (i18n) cho du khách quốc tế.

[ ] Chuyển đổi Frontend sang các Framework SPA (ReactJS/VueJS).

[ ] Tích hợp hệ thống Chatbot Hỗ trợ khách hàng 24/7.

