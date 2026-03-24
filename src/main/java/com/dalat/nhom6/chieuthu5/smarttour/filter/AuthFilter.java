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

        // Khóa các trang giao diện nội bộ. Chỉ được vào khi có Session
        if (uri.endsWith("/user.html") || uri.endsWith("/staff.html") || uri.endsWith("/admin.html")) {
            HttpSession session = req.getSession(false);
            if (session == null || session.getAttribute("USER_ROLE") == null) {
                // Chưa đăng nhập sẽ bị đá về form Login
                res.sendRedirect("/index.html");
                return;
            }

            // Chặn người dùng truy cập trái phép chéo giao diện
            String role = (String) session.getAttribute("USER_ROLE");
            if (uri.endsWith("/user.html") && !role.equals("USER")) {
                res.sendRedirect("/index.html");
                return;
            }
            if (uri.endsWith("/staff.html") && !role.equals("STAFF")) {
                res.sendRedirect("/index.html");
                return;
            }
            if (uri.endsWith("/admin.html") && !role.equals("ADMIN")) {
                res.sendRedirect("/index.html");
                return;
            }
        }

        // Cho phép đi tiếp nếu vượt qua mọi vòng kiểm tra
        chain.doFilter(request, response);
    }
}
