package com.dalat.nhom6.chieuthu5.smarttour.scheduler;

import com.dalat.nhom6.chieuthu5.smarttour.entity.Notification;
import com.dalat.nhom6.chieuthu5.smarttour.entity.Order;
import com.dalat.nhom6.chieuthu5.smarttour.entity.OrderDetail;
import com.dalat.nhom6.chieuthu5.smarttour.repository.NotificationRepository;
import com.dalat.nhom6.chieuthu5.smarttour.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Component
public class ScheduledTasks {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    /**
     * Quét mỗi 1 phút: Tìm các Đơn AWAITING_PAYMENT hoặc PAID mà đến giờ dịch vụ bắt đầu hôm nay.
     * Gửi thông báo cho Khách hàng và Admin (qua WebSocket + ghi DB).
     */
    @Scheduled(cron = "0 * * * * *")  // Mỗi phút một lần
    public void checkBookingReminders() {
        LocalDate today = LocalDate.now();
        LocalTime nowTime = LocalTime.now();
        LocalTime soon = nowTime.plusMinutes(5); // Cảnh báo trước 5 phút

        List<Order> pendingOrders = orderRepository.findByStatus("AWAITING_PAYMENT");
        List<Order> paidOrders = orderRepository.findByStatus("PAID");

        pendingOrders.addAll(paidOrders);

        for (Order order : pendingOrders) {
            for (OrderDetail detail : order.getOrderDetails()) {
                // Kiểm tra nếu ngày đặt là hôm nay và sắp đến giờ
                if (detail.getApplyDate() == null) continue;
                if (!detail.getApplyDate().equals(today)) continue;

                LocalTime svcTime = detail.getBookingTime();
                if (svcTime == null) {
                    // Tour không có giờ cụ thể — thông báo vào đầu ngày (chỉ 1 lần)
                    svcTime = LocalTime.of(8, 0);
                }

                // Cảnh báo nếu giờ dịch vụ trong khoảng [now, now+5min]
                boolean isUpcoming = !svcTime.isBefore(nowTime) && !svcTime.isAfter(soon);
                if (!isUpcoming) continue;

                // Tránh spam: kiểm tra nếu đã có thông báo loại này rồi thì bỏ qua
                String msgKey = "BOOKING_REMINDER_" + order.getId() + "_" + detail.getId();
                boolean alreadyNotified = notificationRepository
                    .findByUserAndType(order.getUser(), msgKey).isPresent();
                if (alreadyNotified) continue;

                String svcName = detail.getService().getServiceName();
                String timeStr = detail.getBookingTime() != null ? detail.getBookingTime().toString() : "trong ngày";

                // Gửi thông báo cho Khách hàng
                String userMsg = "⏰ Nhắc lịch: Dịch vụ \"" + svcName + "\" của bạn bắt đầu lúc " + timeStr
                    + " hôm nay. Vui lòng có mặt đúng giờ!";
                Notification userNotif = Notification.builder()
                    .user(order.getUser())
                    .message(userMsg)
                    .type(msgKey)
                    .isRead(false)
                    .build();
                notificationRepository.save(userNotif);
                messagingTemplate.convertAndSend(
                    "/topic/user/notifications/" + order.getUser().getUsername(), userMsg);

                // Gửi thông báo cho Admin/Staff
                String adminMsg = "📋 Đơn #" + order.getId() + " - Khách \"" + order.getUser().getUsername()
                    + "\" - Dịch vụ \"" + svcName + "\" đã đến giờ bắt đầu (" + timeStr + "). "
                    + (order.getStatus().equals("AWAITING_PAYMENT") ? "⚠️ KHÁCH CHƯA THANH TOÁN!" : "✅ Đã thanh toán.");
                messagingTemplate.convertAndSend("/topic/admin/notifications", adminMsg);
                messagingTemplate.convertAndSend("/topic/staff/notifications", adminMsg);
            }
        }
    }
}
