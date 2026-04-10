package com.dalat.nhom6.chieuthu5.smarttour.filter;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Component;
import java.io.IOException;

public class AuthFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;
        String uri = req.getRequestURI();
        
        System.out.println("===> BẢO VỆ ĐANG CHẶN VÀ KIỂM TRA LINK: " + uri);

        // Khóa các trang giao diện nội bộ. CHỈ bảo vệ staff/admin. index.html mở công khai (Guest Mode).
        if (uri.endsWith("/staff.html") || uri.endsWith("/admin.html")) {
            HttpSession session = req.getSession(false);
            if (session == null || session.getAttribute("USER_ROLE") == null) {
                // Chưa đăng nhập sẽ bị đá về trang đăng nhập
                res.sendRedirect("/login.html");
                return;
            }

            // Chặn người dùng truy cập trái phép chéo giao diện
            String role = (String) session.getAttribute("USER_ROLE");
            if (uri.endsWith("/staff.html") && !role.equals("STAFF")) {
                res.sendRedirect("/login.html");
                return;
            }
            if (uri.endsWith("/admin.html") && !role.equals("ADMIN")) {
                res.sendRedirect("/login.html");
                return;
            }
        }

        // BẢO VỆ API: Chặn Hacker dùng Postman gọi thẳng vào chức năng xóa/sửa dữ liệu
        if (uri.startsWith("/api/admin/") || uri.startsWith("/api/staff/")) {
            HttpSession session = req.getSession(false);
            if (session == null || session.getAttribute("USER_ROLE") == null) {
                res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                res.setContentType("application/json;charset=UTF-8");
                res.getWriter().write("{\"status\":\"error\", \"message\":\"Bảo vệ hệ thống: Vui lòng đăng nhập trước khi gọi API!\"}");
                return;
            }
            
            String role = (String) session.getAttribute("USER_ROLE");
            if (uri.startsWith("/api/admin/") && !"ADMIN".equals(role)) {
                res.setStatus(HttpServletResponse.SC_FORBIDDEN);
                res.setContentType("application/json;charset=UTF-8");
                res.getWriter().write("{\"status\":\"error\", \"message\":\"Xâm nhập trái phép: Hành vi dùng Postman cướp quyền Admin đã bị chặn!\"}");
                return;
            }
            if (uri.startsWith("/api/staff/") && !"STAFF".equals(role)) {
                res.setStatus(HttpServletResponse.SC_FORBIDDEN);
                res.setContentType("application/json;charset=UTF-8");
                res.getWriter().write("{\"status\":\"error\", \"message\":\"Xâm nhập trái phép: Chỉ Đại lý Staff mới được gửi lệnh nàY!\"}");
                return;
            }
        }

        // Cho phép đi tiếp nếu vượt qua mọi vòng kiểm tra
        chain.doFilter(request, response);
    }
}
