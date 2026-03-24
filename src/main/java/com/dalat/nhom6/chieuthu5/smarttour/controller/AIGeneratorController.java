package com.dalat.nhom6.chieuthu5.smarttour.controller;

import com.dalat.nhom6.chieuthu5.smarttour.entity.Location;
import com.dalat.nhom6.chieuthu5.smarttour.entity.Service;
import com.dalat.nhom6.chieuthu5.smarttour.repository.LocationRepository;
import com.dalat.nhom6.chieuthu5.smarttour.repository.ServiceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/user/ai")
public class AIGeneratorController {

    @Autowired
    private LocationRepository locationRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    @PostMapping("/generate")
    public ResponseEntity<?> generateItinerary(
            @RequestParam("arrival") String arrival,
            @RequestParam("departure") String departure,
            @RequestParam("groupType") String groupType,
            @RequestParam("startLocation") String startLocation,
            @RequestParam("pace") String pace,
            @RequestParam("budget") String budget,
            @RequestParam("transport") String transport,
            @RequestParam("preferences") String preferences) {
            
        // 1. RAG Retrieve: Lấy các địa điểm và dịch vụ có sẵn trong CSDL
        List<Location> allLocations = locationRepository.findAll();
        List<Service> allServices = serviceRepository.findAll().stream()
                .filter(s -> s.getIsApproved() != null && s.getIsApproved())
                .collect(Collectors.toList());

        // Lọc bớt trường dư thừa để tiết kiệm token gửi cho AI
        List<String> locNames = allLocations.stream().map(Location::getName).collect(Collectors.toList());
        List<String> svcNames = allServices.stream().map(s -> s.getServiceName() + " (Giá: " + s.getSalePrice() + ")").collect(Collectors.toList());

        // 2. Prompt Builder (Tiêm Ngữ cảnh + Yêu cầu JSON Khắt khe)
        String prompt = String.format(
            "Bạn là trợ lý ảo lên lịch trình du lịch Đà Lạt thông minh. " +
            "Người dùng cung cấp thông tin như sau:\n- Thời gian đến (Check-in Đà Lạt): %s\n- Thời gian rời đi (Checkout): %s\n" +
            "- Nhóm đối tượng: %s. - Điểm xuất phát / Khu vực khách sạn: %s. - Tốc độ tham quan: %s. - Ngân sách: %s. - Phương tiện: %s. - Sở thích: %s.\n\n" +
            "HÃY LỰA CHỌN các địa điểm TRONG DANH SÁCH SAU ĐÂY để xếp lịch trình:\n" +
            "*** Điểm tham quan: %s\n" +
            "*** Quán ăn/Khách sạn: %s\n\n" +
            "LƯU Ý: Buổi nào chưa tới Đà Lạt, hoặc đã đi khỏi Đà Lạt thì để trống location. Không chọn địa danh không có trong danh sách trên! " +
            "BẮT BUỘC TRẢ VỀ CHUẨN JSON MẢNG KHÔNG DƯ THỪA (KHÔNG bọc thẻ markdown ```json). " +
            "Cấu trúc Array chứa Object như sau: [" +
            "{ \"day\": \"Ngày 1\", " +
            "\"morning\": { \"location\": \"Tên Quán\", \"cost\": \"100k\", \"note\": \"Chú thích\" }, " +
            "\"noon\": { \"location\": \"Tên Quán\", \"cost\": \"100k\", \"note\": \"Chú thích\" }, " +
            "\"evening\": { \"location\": \"Tên Quán\", \"cost\": \"100k\", \"note\": \"Chú thích\" } }]",
            arrival, departure, groupType, startLocation, pace, budget, transport, preferences, locNames, svcNames
        );

        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + geminiApiKey;
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        // Escape móng vuốt JSON
        String safePrompt = prompt.replace("\"", "\\\"").replace("\n", "\\n");
        String requestBody = "{\"contents\":[{\"parts\":[{\"text\":\"" + safePrompt + "\"}]}],\"generationConfig\":{\"temperature\":0.5}}";
        HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);

        try {
            // 3. Gọi HTTP Request tới Google
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
            
            // 4. Parse Data của Gemini
            ObjectMapper mapper = new ObjectMapper();
            Map<String, Object> respMap = mapper.readValue(response.getBody(), Map.class);
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) respMap.get("candidates");
            Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
            List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
            String jsonOutput = (String) parts.get(0).get("text");

            // Xóa markdown json thừa nếu có
            jsonOutput = jsonOutput.replace("```json", "").replace("```", "").trim();
            
            // Map sang Java List
            List<Map<String, Object>> itineraryObj = mapper.readValue(jsonOutput, List.class);

            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "AI RAG đã xử lý thành công với " + locNames.size() + " địa điểm database!",
                "itinerary", itineraryObj
            ));
        } catch (HttpClientErrorException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", "Lỗi API Key không hợp lệ hoặc Server Gemini quá tải"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Lỗi Parse JSON: Dữ liệu AI trả về không đúng định dạng."));
        }
    }
}
