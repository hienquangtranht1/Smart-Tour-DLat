package com.dalat.nhom6.chieuthu5.smarttour;

import com.dalat.nhom6.chieuthu5.smarttour.entity.Role;
import com.dalat.nhom6.chieuthu5.smarttour.entity.User;
import com.dalat.nhom6.chieuthu5.smarttour.entity.Agency;
import com.dalat.nhom6.chieuthu5.smarttour.repository.UserRepository;
import com.dalat.nhom6.chieuthu5.smarttour.entity.Service;
import com.dalat.nhom6.chieuthu5.smarttour.repository.ServiceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.jdbc.core.JdbcTemplate;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Override
    public void run(String... args) throws Exception {
        System.out.println("====== Kiểm tra và Đồng bộ Database ======");
        
        try {
            // FIX LỖI MYSQL CŨ: Password BCrypt dài 60 ký tự. 
            // Nếu DB cũ chỉ có VARCHAR(50), nó sẽ cắt cụt Hash lúc lưu, làm cho quá trình Đăng nhập luôn Sai Mật Khẩu!
            // Lệnh này ép độ dài cột lên 255.
            jdbcTemplate.execute("ALTER TABLE users MODIFY password VARCHAR(255)");
            System.out.println("====== OK: Đã fix length cột password thành VARCHAR(255)");
        } catch (Exception e) {
            System.out.println("====== LƯU Ý DB: Không thể Alter table users. Nếu dùng H2 in-memory thì an toàn, nếu MySQL cần đảm bảo VARCHAR > 60.");
        }
        
        // Update password đúng chuẩn BCrypt
        createOrUpdateUser("admin", passwordEncoder.encode("123456"), "admin@smarttour.com", Role.ADMIN);
        Agency staffAgency = createOrUpdateUserAndGetAgency("staff", passwordEncoder.encode("123456"), "agency@smarttour.com", Role.STAFF);
        createOrUpdateUser("demo", passwordEncoder.encode("123"), "guest@smarttour.com", Role.USER);
            
        System.out.println("====== ĐÃ RESET MẬT KHẨU (Đã Mã Hóa BCrypt): admin (123456) | staff (123456) | demo (123)");

        // Tạo 10 dịch vụ mẫu nếu chưa có dịch vụ nào
        if (serviceRepository.count() == 0 && staffAgency != null) {
            System.out.println("====== Đang tạo 10 Dịch vụ mẫu đại diện ======");
            createSampleServices(staffAgency);
        }
    }

    @Autowired
    private com.dalat.nhom6.chieuthu5.smarttour.repository.AgencyRepository agencyRepository;

    private void createOrUpdateUser(String username, String encodedPassword, String email, Role role) {
        createOrUpdateUserAndGetAgency(username, encodedPassword, email, role);
    }

    private Agency createOrUpdateUserAndGetAgency(String username, String encodedPassword, String email, Role role) {
        User user = userRepository.findByUsername(username).orElse(
            User.builder()
                .username(username)
                .email(email)
                .role(role)
                .isLocked(false)
                .createdAt(LocalDateTime.now())
                .build()
        );
        
        user.setPassword(encodedPassword);
        user = userRepository.save(user);

        if (role == Role.STAFF) {
            Agency agency = agencyRepository.findByUserId(user.getId()).orElse(null);
            if (agency == null) {
                agency = com.dalat.nhom6.chieuthu5.smarttour.entity.Agency.builder()
                    .user(user)
                    .agencyName("Du Lịch " + username.toUpperCase())
                    .businessLicense("GP-" + System.currentTimeMillis())
                    .address("Đà Lạt, Lâm Đồng")
                    .isApproved(true)
                    .build();
                return agencyRepository.save(agency);
            }
            return agency;
        }
        return null;
    }

    private void createSampleServices(Agency agency) {
        String[] mockImages = {
            "https://images.unsplash.com/photo-1542314831-c6a4d27160c9", "https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd",
            "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4", "https://images.unsplash.com/photo-1571896349842-33c89424de2d",
            "https://images.unsplash.com/photo-1551882547-ff40c6181966", "https://images.unsplash.com/photo-1510414842594-a61c69b5ae57",
            "https://images.unsplash.com/photo-1512453979798-5ea266f8880c", "https://images.unsplash.com/photo-1563911302283-d2bc129e7570",
            "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b", "https://images.unsplash.com/photo-1445019980597-93fa8acb246c"
        };
        
        for (int i = 1; i <= 5; i++) {
            serviceRepository.save(Service.builder()
                .agency(agency).serviceName("Khách Sạn Mộng Mơ Đà Lạt " + i)
                .serviceType("HOTEL").description("Tận hưởng kì nghỉ tuyệt vời tại Đà Lạt với phòng nghỉ hiện đại, tiện nghi sang trọng và view ngắm thành phố cực đẹp. Bao gồm bữa sáng buffet miễn phí.")
                .originalPrice(new BigDecimal(1200000 + (i*100000))).salePrice(new BigDecimal(850000 + (i*50000)))
                .imageUrl(mockImages[(i-1)]).isApproved(true).isActive(true)
                .openingTime("00:00").closingTime("23:59")
                .mapPoints("11.94" + i + ",108.45" + i + ";Khách Sạn " + i)
                .hotelName("Dream Hotel " + i).roomType(i % 2 == 0 ? "Queen Room" : "King Room").availableRooms(10 + i * 2)
                .createdAt(LocalDateTime.now())
                .build());
        }
        
        for (int i = 1; i <= 3; i++) {
            serviceRepository.save(Service.builder()
                .agency(agency).serviceName("Tour Du Lịch Cắm Trại Săn Mây " + i)
                .serviceType("TOUR").description("Trải nghiệm cắm trại qua đêm trên đồi thông, thưởng thức tiệc BBQ lửa trại và dậy sớm đón bình minh săn mây, chụp những tấm ảnh check-in tuyệt đẹp.")
                .originalPrice(new BigDecimal(750000 + (i*50000))).salePrice(new BigDecimal(500000 + (i*20000)))
                .imageUrl(mockImages[4 + i]).isApproved(true).isActive(true)
                .maxPeople(15).durationDays(2).transportation("Xe Jeep chuyên dụng")
                .mapPoints("11.90" + i + ",108.43" + i + ";Đồi Trọc Đón Bình Minh")
                .createdAt(LocalDateTime.now())
                .build());
        }

        for (int i = 1; i <= 2; i++) {
            serviceRepository.save(Service.builder()
                .agency(agency).serviceName(i == 1 ? "Buffet Rau Leguda" : "Cà Phê Mê Linh")
                .serviceType("CAFE").description(i == 1 ? "Buffet rau lẩu không giới hạn với các loại rau xanh tươi ngon nguồn gốc rõ ràng tại Đà Lạt." : "Thưởng thức cà phê chồn nguyên chất và check-in cánh đồng hướng dương siêu đẹp.")
                .originalPrice(new BigDecimal(250000)).salePrice(new BigDecimal(199000))
                .imageUrl(mockImages[7 + i]).isApproved(true).isActive(true)
                .openingTime(i == 1 ? "10:00" : "06:30").closingTime(i == 1 ? "22:00" : "18:00")
                .mapPoints("11.92" + i + ",108.44" + i + ";Địa điểm nổi bật")
                .createdAt(LocalDateTime.now())
                .build());
        }
    }
}
