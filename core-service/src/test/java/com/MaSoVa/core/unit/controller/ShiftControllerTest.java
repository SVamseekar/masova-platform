package com.MaSoVa.core.unit.controller;

import com.MaSoVa.core.user.controller.ShiftController;
import com.MaSoVa.core.user.service.ShiftService;
import com.MaSoVa.shared.entity.Shift;
import com.MaSoVa.shared.test.BaseServiceTest;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ShiftController Unit Tests")
class ShiftControllerTest extends BaseServiceTest {

    @Mock private ShiftService shiftService;
    @InjectMocks private ShiftController shiftController;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        // Set up a security context so SpEL in @PreAuthorize can resolve authentication.name
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken("shift-1", null,
                List.of(new SimpleGrantedAuthority("ROLE_MANAGER")))
        );
        ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
        MappingJackson2HttpMessageConverter converter = new MappingJackson2HttpMessageConverter(objectMapper);
        mockMvc = MockMvcBuilders.standaloneSetup(shiftController)
            .setMessageConverters(converter)
            .build();
    }

    private static final String VALID_SHIFT_JSON =
        "{\"storeId\":\"store-1\",\"employeeId\":\"emp-1\",\"type\":\"REGULAR\",\"scheduledStart\":\"2026-05-15T09:00:00\",\"scheduledEnd\":\"2026-05-15T17:00:00\"}";

    private Shift buildShift(String id) {
        Shift shift = new Shift();
        shift.setId(id);
        shift.setEmployeeId("emp-1");
        shift.setStoreId("store-1");
        shift.setType(com.MaSoVa.shared.enums.ShiftType.REGULAR);
        shift.setScheduledStart(java.time.LocalDateTime.of(2026, 5, 15, 9, 0));
        shift.setScheduledEnd(java.time.LocalDateTime.of(2026, 5, 15, 17, 0));
        return shift;
    }

    @Test
    @DisplayName("POST /api/shifts returns 200 with created shift")
    void createShift_returns200() throws Exception {
        when(shiftService.createShift(any())).thenReturn(buildShift("shift-new"));

        mockMvc.perform(post("/api/shifts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(VALID_SHIFT_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value("shift-new"));
    }

    @Test
    @DisplayName("POST /api/shifts/bulk returns 200 with bulk created shifts")
    void bulkCreateShifts_returns200() throws Exception {
        when(shiftService.bulkCreateShifts(any())).thenReturn(List.of(buildShift("shift-1"), buildShift("shift-2")));

        mockMvc.perform(post("/api/shifts/bulk")
                .contentType(MediaType.APPLICATION_JSON)
                .content("[" + VALID_SHIFT_JSON + "," + VALID_SHIFT_JSON + "]"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value("shift-1"));
    }

    // Note: confirmShift/startShift/completeShift use SpEL @shiftService bean reference in
    // @PreAuthorize — these are tested in ShiftControllerIT (integration tests, full Spring context)

    @Test
    @DisplayName("DELETE /api/shifts/{shiftId} returns 200")
    void deleteShift_returns200() throws Exception {
        doNothing().when(shiftService).cancelShift("shift-1");

        mockMvc.perform(delete("/api/shifts/shift-1"))
            .andExpect(status().isOk());
    }
}
