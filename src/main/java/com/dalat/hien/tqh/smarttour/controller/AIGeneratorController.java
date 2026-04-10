package com.dalat.hien.tqh.smarttour.controller;

import com.dalat.hien.tqh.smarttour.entity.Location;
import com.dalat.hien.tqh.smarttour.entity.Service;
import com.dalat.hien.tqh.smarttour.repository.LocationRepository;
import com.dalat.hien.tqh.smarttour.repository.ServiceRepository;
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
    public ResponseEntity<?> generateItinerary(@RequestParam Map<String, String> params) {
        System.out.println("AI Generate Request Params: " + params);

        String arrival = params.getOrDefault("arrival", "");
        String departure = params.getOrDefault("departure", "");
        String groupType = params.getOrDefault("groupType", "Gia đình");
        String startLocation = params.getOrDefault("startLocation", "Trung tâm");
        String pace = params.getOrDefault("pace", "Vừa phải");
        String budget = params.getOrDefault("budget", "5,000,000");
        String transport = params.getOrDefault("transport", "Xe máy");
        String preferences = params.getOrDefault("preferences", "Săn mây, ăn lẩu");

        if (arrival.isEmpty() || departure.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Vui lòng chọn ngày đến và ngày đi!"));
        }
            
        // 1. RAG Retrieve
        List<Location> allLocations = locationRepository.findAll();
        List<Service> allServices = serviceRepository.findAll().stream()
                .filter(s -> s.getIsApproved() != null && s.getIsApproved() && !Boolean.TRUE.equals(s.getIsDeleted()))
                .collect(Collectors.toList());

        List<String> locNames = allLocations.stream().map(Location::getName).collect(Collectors.toList());
        List<String> svcNames = allServices.stream().map(s -> s.getServiceName() + " (Giá: " + (s.getSalePrice() != null ? s.getSalePrice() : "Liên hệ") + ")").collect(Collectors.toList());

        // 2. Prompt Builder
        String prompt = String.format(
            "Bạn là trợ lý ảo lên lịch trình du lịch Đà Lạt thông minh. " +
            "Người dùng cung cấp thông tin như sau:\n- Thời gian đến: %s\n- Thời gian rời đi: %s\n" +
            "- Nhóm: %s. - Điểm xuất phát: %s. - Tốc độ: %s. - Ngân sách: %s. - Phương tiện: %s. - Sở thích: %s.\n\n" +
            "HÃY LỰA CHỌN các địa điểm TRONG DANH SÁCH SAU ĐÂY để xếp lịch trình (BẮT BUỘC KHÔNG CHỌN NGOÀI DANH SÁCH):\n" +
            "*** Điểm tham quan: %s\n" +
            "*** Quán ăn/Khách sạn: %s\n\n" +
            "BẮT BUỘC TRẢ VỀ CHUẨN JSON MẢNG KHÔNG DƯ THỪA (KHÔNG bọc thẻ markdown ```json). " +
            "Cấu trúc: [" +
            "{ \"day\": \"Ngày 1\", " +
            "\"morning\": { \"location\": \"Tên\", \"cost\": \"100k\", \"note\": \"...\" }, " +
            "\"noon\": { \"location\": \"Tên\", \"cost\": \"100k\", \"note\": \"...\" }, " +
            "\"evening\": { \"location\": \"Tên\", \"cost\": \"100k\", \"note\": \"...\" } }]",
            arrival, departure, groupType, startLocation, pace, budget, transport, preferences, locNames, svcNames
        );

        // Dùng gemini-2.5-flash theo API chuẩn của Google
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + geminiApiKey;
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        ObjectMapper mapper = new ObjectMapper();
        try {
            Map<String, Object> textPart = Map.of("text", prompt);
            Map<String, Object> parts = Map.of("parts", List.of(textPart));
            Map<String, Object> requestBodyMap = Map.of("contents", List.of(Map.of("parts", List.of(textPart))), "generationConfig", Map.of("temperature", 0.7));

            String requestBody = mapper.writeValueAsString(requestBodyMap);
            HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
            Map<String, Object> respMap = mapper.readValue(response.getBody(), Map.class);
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) respMap.get("candidates");
            if (candidates == null || candidates.isEmpty()) {
                throw new Exception("Gemini không trả về kết quả.");
            }

            Map<String, Object> contentMap = (Map<String, Object>) candidates.get(0).get("content");
            List<Map<String, Object>> resParts = (List<Map<String, Object>>) contentMap.get("parts");
            String jsonOutput = (String) resParts.get(0).get("text");

            int startIndex = jsonOutput.indexOf("[");
            int endIndex = jsonOutput.lastIndexOf("]");
            if (startIndex != -1 && endIndex != -1) {
                jsonOutput = jsonOutput.substring(startIndex, endIndex + 1);
            }
            
            System.out.println("JSON AI trả về: " + jsonOutput);
            
            List<Map<String, Object>> itineraryObj = mapper.readValue(jsonOutput, List.class);
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Trợ lý AI đã xây dựng xong lịch trình!",
                "itinerary", itineraryObj
            ));
        } catch (HttpClientErrorException ex) {
            String errorMsg = ex.getResponseBodyAsString();
            System.err.println("Gemini Error: " + errorMsg);
            return ResponseEntity.status(ex.getStatusCode()).body(Map.of("error", "Lỗi dịch vụ AI: " + errorMsg));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Hệ thống AI đang bận, vui lòng thử lại!"));
        }
    }
}