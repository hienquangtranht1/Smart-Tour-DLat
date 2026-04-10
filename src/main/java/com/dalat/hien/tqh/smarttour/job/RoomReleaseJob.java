package com.dalat.hien.tqh.smarttour.job;

import com.dalat.hien.tqh.smarttour.entity.OrderDetail;
import com.dalat.hien.tqh.smarttour.entity.Service;
import com.dalat.hien.tqh.smarttour.repository.OrderDetailRepository;
import com.dalat.hien.tqh.smarttour.repository.ServiceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class RoomReleaseJob {

    @Autowired
    private OrderDetailRepository orderDetailRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    // Chạy mỗi giờ một lần: "0 0 * * * *" hoặc mỗi 10 phút: "0 */10 * * * *"
    // Ở đây đặt 10 phút để nhanh chóng hoàn phòng
    @Scheduled(cron = "0 */10 * * * *")
    @Transactional
    public void releaseExpiredRooms() {
        LocalDateTime now = LocalDateTime.now();
        List<OrderDetail> expiredDetails = orderDetailRepository.findExpiredHotelBookings(now);

        for (OrderDetail detail : expiredDetails) {
            Service svc = detail.getService();
            if ("HOTEL".equals(svc.getServiceType()) && svc.getAvailableRooms() != null) {
                int quantity = detail.getQuantity() != null ? detail.getQuantity() : 0;
                svc.setAvailableRooms(svc.getAvailableRooms() + quantity);
                serviceRepository.save(svc);
            }
            detail.setIsRoomReturned(true);
            orderDetailRepository.save(detail);

            System.out.println("✅ Tự động hoàn " + detail.getQuantity() + " phòng cho KS: " + svc.getServiceName());
        }
    }
}
