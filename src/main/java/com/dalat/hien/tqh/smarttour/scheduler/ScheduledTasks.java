package com.dalat.hien.tqh.smarttour.scheduler;

import com.dalat.hien.tqh.smarttour.entity.*;
import com.dalat.hien.tqh.smarttour.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;


import java.time.LocalDateTime;
import java.util.List;

@Component
public class ScheduledTasks {

    @Autowired
    private OrderRepository orderRepository;
    @Autowired
    private ServiceRepository serviceRepository;
    @Autowired
    private NotificationRepository notificationRepository;
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // 1. TỰ ĐỘNG HOÀN THÀNH KHÁCH SẠN (Kiểm tra mỗi 1 phút)
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void autoCompleteHotelOrders() {
        // Tìm các đơn đang chạy
        List<Order> inProgressOrders = orderRepository.findAll().stream()
                .filter(o -> "IN_PROGRESS".equals(o.getStatus()))
                .toList();

        for (Order o : inProgressOrders) {
            if (o.getOrderDetails() != null && !o.getOrderDetails().isEmpty()) {
                OrderDetail d = o.getOrderDetails().get(0);
                Service svc = d.getService();
                
                // Chỉ áp dụng tự động cho HOTEL
                if (svc != null && "HOTEL".equals(svc.getServiceType())) {
                    if (d.getApplyDate() != null && d.getBookingTime() != null && d.getBookingDays() != null) {
                        // Công thức: Ngày đến + Giờ đến + Số ngày ở
                        // VD: 25/03/2026 lúc 14:00 ở 3 ngày -> EndTime = 28/03/2026 lúc 14:00
                        LocalDateTime endTime = d.getApplyDate().atTime(d.getBookingTime()).plusDays(d.getBookingDays());
                        
                        // Nếu thời gian hiện tại đã vượt qua thời gian kết thúc
                        if (!LocalDateTime.now().isBefore(endTime)) {
                            o.setStatus("COMPLETED");
                            orderRepository.save(o);

                            // Hoàn lại phòng trống cho hệ thống
                            if (svc.getAvailableRooms() != null) {
                                svc.setAvailableRooms(svc.getAvailableRooms() + d.getQuantity());
                                serviceRepository.save(svc);
                            }

                            sendNotification(o.getUser(), "Dịch vụ phòng " + svc.getServiceName() + " đã hết hạn và hoàn tất. Cảm ơn quý khách!");
                            if (svc.getAgency() != null && svc.getAgency().getUser() != null) {
                                sendNotification(svc.getAgency().getUser(), "Hệ thống tự động: Đơn phòng #" + o.getId() + " đã tự động kết thúc và trả phòng.");
                            }
                        }
                    }
                }
            }
        }
    }

    // ĐÃ XÓA: Chức năng tự hủy đơn chưa thanh toán đã được chuyển cho Staff xử lý thủ công.
    // Staff có quyền Hủy đơn PENDING / AWAITING_PAYMENT bất cứ lúc nào qua giao diện.
    // Chỉ các đơn TỚI HẠN SỬ DỤNG mới bị hệ thống tự động xử lý.

    private void sendNotification(User user, String message) {
        if (user == null) return;
        Notification n = Notification.builder()
                .user(user)
                .message(message)
                .type("SYSTEM_AUTO")
                .isRead(false)
                .build();
        notificationRepository.save(n);
        if (user.getRole() != null && "STAFF".equals(user.getRole().name())) {
            messagingTemplate.convertAndSend("/topic/staff/notifications", message);
        }
    }
}
