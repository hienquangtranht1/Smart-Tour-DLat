package com.dalat.hien.tqh.smarttour.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {

    @Value("${app.otp.expiry-minutes:5}")
    private int expiryMinutes;

    // Lưu OTP tạm thời: email -> [otp, thời gian hết hạn]
    private final Map<String, OtpEntry> otpStore = new ConcurrentHashMap<>();

    public String generateAndStore(String email) {
        String otp = String.format("%06d", new Random().nextInt(999999));
        LocalDateTime expiry = LocalDateTime.now().plusMinutes(expiryMinutes);
        otpStore.put(email.toLowerCase(), new OtpEntry(otp, expiry));
        return otp;
    }

    public boolean verify(String email, String inputOtp) {
        String key = email.toLowerCase();
        OtpEntry entry = otpStore.get(key);
        if (entry == null) return false;
        if (LocalDateTime.now().isAfter(entry.expiry())) {
            otpStore.remove(key);
            return false;
        }
        if (entry.otp().equals(inputOtp)) {
            otpStore.remove(key); // Xóa OTP sau khi dùng 1 lần
            return true;
        }
        return false;
    }

    private record OtpEntry(String otp, LocalDateTime expiry) {}
}
