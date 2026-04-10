package com.dalat.hien.tqh.smarttour.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public void sendOtpEmail(String toEmail, String otp) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail, "Smart Tour Đà Lạt");
            helper.setTo(toEmail);
            helper.setSubject("🔐 Mã Xác Thực OTP - Smart Tour Đà Lạt");
            helper.setText(buildOtpEmailHtml(otp), true); // true = HTML
            mailSender.send(message);
        } catch (Exception e) {
            throw new RuntimeException("Gửi email OTP thất bại: " + e.getMessage());
        }
    }

    public void sendEmail(String toEmail, String subject, String body) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail, "Smart Tour Đà Lạt");
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(body, true);
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Gửi email thất bại: " + e.getMessage());
        }
    }

    private String buildOtpEmailHtml(String otp) {
        return """
            <!DOCTYPE html>
            <html lang="vi">
            <head><meta charset="UTF-8"></head>
            <body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',sans-serif">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0">
                <tr><td align="center">
                  <table width="520" cellpadding="0" cellspacing="0" style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.1)">
                    <tr><td style="background:linear-gradient(135deg,#6366f1,#818cf8);padding:32px;text-align:center">
                      <h1 style="color:white;margin:0;font-size:24px">🏔️ Smart Tour Đà Lạt</h1>
                      <p style="color:rgba(255,255,255,.8);margin:8px 0 0">Hệ thống Thiết kế Lịch trình & Đặt Tour Thông minh</p>
                    </td></tr>
                    <tr><td style="padding:40px 32px;text-align:center">
                      <p style="color:#334155;font-size:16px;margin:0 0 24px">Mã xác thực OTP của bạn là:</p>
                      <div style="background:#f8fafc;border:2px dashed #818cf8;border-radius:12px;padding:24px;margin-bottom:24px">
                        <span style="font-size:42px;font-weight:bold;letter-spacing:12px;color:#4f46e5">%s</span>
                      </div>
                      <p style="color:#64748b;font-size:14px;margin:0">Mã này có hiệu lực trong <b>5 phút</b>. Không chia sẻ mã này với bất kỳ ai.</p>
                    </td></tr>
                    <tr><td style="background:#f8fafc;padding:20px 32px;text-align:center">
                      <p style="color:#94a3b8;font-size:12px;margin:0">© 2026 Smart Tour Đà Lạt - Phát triển bởi TQHienc6@gmail.com</p>
                    </td></tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
        """.formatted(otp);
    }

    public void sendAccountApprovedEmail(String toEmail, String agencyName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail, "Smart Tour Đà Lạt");
            helper.setTo(toEmail);
            helper.setSubject("🎉 Chúc mừng! Tài khoản Đại lý của bạn đã được duyệt - Smart Tour Đà Lạt");
            helper.setText(buildApprovalEmailHtml("Tài khoản Đại lý <b>" + agencyName + "</b> của bạn đã được kiểm duyệt và kích hoạt thành công. Bắt đầu kinh doanh ngay thôi!"), true);
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Gửi email Duyệt Tài khoản thất bại: " + e.getMessage());
        }
    }

    public void sendServiceApprovedEmail(String toEmail, String serviceName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail, "Smart Tour Đà Lạt");
            helper.setTo(toEmail);
            helper.setSubject("✅ Dịch vụ của bạn đã được duyệt - Smart Tour Đà Lạt");
            helper.setText(buildApprovalEmailHtml("Dịch vụ / Tour <b>" + serviceName + "</b> của bạn đã được hệ thống phê duyệt và chính thức xuất bản cho khách hàng xem."), true);
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Gửi email Duyệt Dịch vụ thất bại: " + e.getMessage());
        }
    }

    private String buildApprovalEmailHtml(String contentMessage) {
        return """
            <!DOCTYPE html>
            <html lang="vi">
            <head><meta charset="UTF-8"></head>
            <body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',sans-serif">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0">
                <tr><td align="center">
                  <table width="520" cellpadding="0" cellspacing="0" style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.1)">
                    <tr><td style="background:linear-gradient(135deg,#10b981,#059669);padding:32px;text-align:center">
                      <h1 style="color:white;margin:0;font-size:24px">🏔️ Smart Tour Đà Lạt</h1>
                      <p style="color:rgba(255,255,255,.8);margin:8px 0 0">Thông Báo Hệ Thống</p>
                    </td></tr>
                    <tr><td style="padding:40px 32px;text-align:center">
                      <div style="font-size:48px;margin-bottom:16px">🎉</div>
                      <p style="color:#334155;font-size:16px;line-height:1.6;margin:0 0 24px">%s</p>
                      <a href="http://localhost:8080/index.html" style="display:inline-block;background:#10b981;color:white;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:bold">Đăng nhập Quản lý</a>
                    </td></tr>
                    <tr><td style="background:#f8fafc;padding:20px 32px;text-align:center">
                      <p style="color:#94a3b8;font-size:12px;margin:0">© 2026 Smart Tour Đà Lạt - Phát triển bởi TQHienc6@gmail.com</p>
                    </td></tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
        """.formatted(contentMessage);
    }
}
