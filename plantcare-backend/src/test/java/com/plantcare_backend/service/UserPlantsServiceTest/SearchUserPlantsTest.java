package com.plantcare_backend.service.UserPlantsServiceTest;


import com.plantcare_backend.dto.request.userPlants.UserPlantsSearchRequestDTO;
import com.plantcare_backend.dto.response.userPlants.UserPlantsSearchResponseDTO;
import com.plantcare_backend.model.UserPlants;
import com.plantcare_backend.repository.UserPlantRepository;
import com.plantcare_backend.service.impl.UserPlantsServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SearchUserPlantsTest {

    @Mock
    private UserPlantRepository userPlantRepository;

    // Dùng Spy để có thể stub convertToUserPlantsResponseDTO
    @Spy
    @InjectMocks
    private UserPlantsServiceImpl plantService;

    private UserPlants up1;
    private UserPlants up2;

    @BeforeEach
    void setUp() {
        up1 = new UserPlants();
        up2 = new UserPlants();

        up1.setUserPlantId(1L);
        up2.setUserPlantId(2L);

        up1.setUserId(99L);
        up2.setUserId(99L);

        up1.setPlantName("Pothos");
        up2.setPlantName("Pothos");

        up1.setPlantId(1L);
        up2.setPlantId(2L);

    }

    @Test
    void searchUserPlants_userIdAndKeyword_shouldUseCombinedQuery() {
        UserPlantsSearchRequestDTO req = new UserPlantsSearchRequestDTO();
        req.setUserId(99L);
        req.setKeywordOfCommonName("pothos");
        req.setPageNo(1);
        req.setPageSize(5);
        req.setSortBy("plantName");
        req.setSortDirection("DESC");

        List<UserPlants> data = Arrays.asList(up1, up2);
        Page<UserPlants> page = new PageImpl<>(data, PageRequest.of(1, 5, Sort.by(Sort.Direction.DESC, "plantName")), 12);

        when(userPlantRepository.findByUserIdAndPlantNameContainingIgnoreCase(eq(99L), eq("pothos"), any(Pageable.class)))
                .thenReturn(page);

        UserPlantsSearchResponseDTO res = plantService.searchUserPlants(req);

        assertNotNull(res);
        assertEquals(2, res.getUserPlants().size());
        assertEquals(12, res.getTotalElements());
        assertEquals(page.getTotalPages(), res.getTotalPages());
        assertEquals(1, res.getCurrentPage());
        assertEquals(5, res.getPageSize());

        // Bắt và kiểm tra Pageable truyền vào repo
        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(userPlantRepository, times(1))
                .findByUserIdAndPlantNameContainingIgnoreCase(eq(99L), eq("pothos"), pageableCaptor.capture());

        Pageable used = pageableCaptor.getValue();
        assertEquals(1, used.getPageNumber());
        assertEquals(5, used.getPageSize());
        assertEquals(Sort.Direction.DESC, used.getSort().getOrderFor("plantName").getDirection());

        System.out.println("✅ searchUserPlants_userIdAndKeyword_shouldUseCombinedQuery: PASSED");
    }

    @Test
    void searchUserPlants_onlyUserId_shouldUseUserQuery() {
        UserPlantsSearchRequestDTO req = new UserPlantsSearchRequestDTO();
        req.setUserId(77L);
        req.setKeywordOfCommonName(""); // rỗng -> không dùng keyword
        req.setPageNo(0);
        req.setPageSize(10);
        req.setSortBy("createdAt");
        req.setSortDirection("ASC");

        List<UserPlants> data = Arrays.asList(up1);
        Page<UserPlants> page = new PageImpl<>(data, PageRequest.of(0, 10, Sort.by(Sort.Direction.ASC, "createdAt")), 1);

        when(userPlantRepository.findByUserId(eq(77L), any(Pageable.class))).thenReturn(page);

        UserPlantsSearchResponseDTO res = plantService.searchUserPlants(req);

        assertNotNull(res);
        assertEquals(1, res.getUserPlants().size());
        assertEquals(1, res.getTotalElements());
        assertEquals(page.getTotalPages(), res.getTotalPages());
        assertEquals(0, res.getCurrentPage());
        assertEquals(10, res.getPageSize());

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(userPlantRepository, times(1)).findByUserId(eq(77L), pageableCaptor.capture());
        Pageable used = pageableCaptor.getValue();
        assertEquals(0, used.getPageNumber());
        assertEquals(10, used.getPageSize());
        assertEquals(Sort.Direction.ASC, used.getSort().getOrderFor("createdAt").getDirection());

        // Đảm bảo các nhánh khác không bị gọi
        verify(userPlantRepository, never()).findByUserIdAndPlantNameContainingIgnoreCase(anyLong(), anyString(), any());
        verify(userPlantRepository, never()).findByPlantNameContainingIgnoreCase(anyString(), any());
        verify(userPlantRepository, never()).findAll(any(Pageable.class));

        System.out.println("✅ searchUserPlants_onlyUserId_shouldUseUserQuery: PASSED");
    }

    @Test
    void searchUserPlants_onlyKeyword_shouldUseKeywordQuery() {
        UserPlantsSearchRequestDTO req = new UserPlantsSearchRequestDTO();
        req.setUserId(null);
        req.setKeywordOfCommonName("aloe");
        req.setPageNo(2);
        req.setPageSize(3);
        req.setSortBy("plantName");
        req.setSortDirection("ASC");

        Page<UserPlants> page = new PageImpl<>(
                Arrays.asList(up1, up2),
                PageRequest.of(2, 3, Sort.by(Sort.Direction.ASC, "plantName")),
                8
        );

        when(userPlantRepository.findByPlantNameContainingIgnoreCase(eq("aloe"), any(Pageable.class)))
                .thenReturn(page);

        UserPlantsSearchResponseDTO res = plantService.searchUserPlants(req);

        assertNotNull(res);
        assertEquals(2, res.getUserPlants().size());
        assertEquals(8, res.getTotalElements());
        assertEquals(page.getTotalPages(), res.getTotalPages());
        assertEquals(2, res.getCurrentPage());
        assertEquals(3, res.getPageSize());

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(userPlantRepository, times(1)).findByPlantNameContainingIgnoreCase(eq("aloe"), pageableCaptor.capture());
        Pageable used = pageableCaptor.getValue();
        assertEquals(2, used.getPageNumber());
        assertEquals(3, used.getPageSize());
        assertEquals(Sort.Direction.ASC, used.getSort().getOrderFor("plantName").getDirection());

        verify(userPlantRepository, never()).findByUserIdAndPlantNameContainingIgnoreCase(anyLong(), anyString(), any());
        verify(userPlantRepository, never()).findByUserId(anyLong(), any());
        verify(userPlantRepository, never()).findAll(any(Pageable.class));

        System.out.println("✅ searchUserPlants_onlyKeyword_shouldUseKeywordQuery: PASSED");
    }

    @Test
    void searchUserPlants_noFilters_shouldUseFindAll() {
        UserPlantsSearchRequestDTO req = new UserPlantsSearchRequestDTO();
        req.setUserId(null);
        req.setKeywordOfCommonName(null);
        req.setPageNo(0);
        req.setPageSize(2);
        req.setSortBy("plantName");
        req.setSortDirection("ASC");

        Page<UserPlants> page = new PageImpl<>(
                Collections.singletonList(up1),
                PageRequest.of(0, 2, Sort.by(Sort.Direction.ASC, "plantName")),
                1
        );

        when(userPlantRepository.findAll(any(Pageable.class))).thenReturn(page);

        UserPlantsSearchResponseDTO res = plantService.searchUserPlants(req);

        assertNotNull(res);
        assertEquals(1, res.getUserPlants().size());
        assertEquals(1, res.getTotalElements());
        assertEquals(page.getTotalPages(), res.getTotalPages());
        assertEquals(0, res.getCurrentPage());
        assertEquals(2, res.getPageSize());

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(userPlantRepository, times(1)).findAll(pageableCaptor.capture());
        Pageable used = pageableCaptor.getValue();
        assertEquals(0, used.getPageNumber());
        assertEquals(2, used.getPageSize());
        assertEquals(Sort.Direction.ASC, used.getSort().getOrderFor("plantName").getDirection());

        verify(userPlantRepository, never()).findByUserIdAndPlantNameContainingIgnoreCase(anyLong(), anyString(), any());
        verify(userPlantRepository, never()).findByUserId(anyLong(), any());
        verify(userPlantRepository, never()).findByPlantNameContainingIgnoreCase(anyString(), any());

        System.out.println("✅ searchUserPlants_noFilters_shouldUseFindAll: PASSED");
    }

    @Test
    void searchUserPlants_nullSortParams_shouldFallbackToDefaults() {
        UserPlantsSearchRequestDTO req = new UserPlantsSearchRequestDTO();
        req.setUserId(5L);
        req.setKeywordOfCommonName(null);
        req.setPageNo(0);
        req.setPageSize(10);
        req.setSortBy(null);          // => default "plantName"
        req.setSortDirection(null);   // => default "ASC"

        Page<UserPlants> page = new PageImpl<>(
                Arrays.asList(up1, up2),
                PageRequest.of(0, 10, Sort.by(Sort.Direction.ASC, "plantName")),
                2
        );

        when(userPlantRepository.findByUserId(eq(5L), any(Pageable.class))).thenReturn(page);

        UserPlantsSearchResponseDTO res = plantService.searchUserPlants(req);

        assertNotNull(res);
        assertEquals(2, res.getUserPlants().size());
        assertEquals(2, res.getTotalElements());
        assertEquals(page.getTotalPages(), res.getTotalPages());
        assertEquals(0, res.getCurrentPage());
        assertEquals(10, res.getPageSize());

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(userPlantRepository, times(1)).findByUserId(eq(5L), pageableCaptor.capture());
        Pageable used = pageableCaptor.getValue();
        assertEquals(0, used.getPageNumber());
        assertEquals(10, used.getPageSize());
        assertEquals(Sort.Direction.ASC, used.getSort().getOrderFor("plantName").getDirection());

        System.out.println("✅ searchUserPlants_nullSortParams_shouldFallbackToDefaults: PASSED");
    }

    @Test
    void searchUserPlants_emptyKeywordWithUserId_shouldBehaveAsUserOnly() {
        UserPlantsSearchRequestDTO req = new UserPlantsSearchRequestDTO();
        req.setUserId(42L);
        req.setKeywordOfCommonName(""); // empty => không xét keyword
        req.setPageNo(3);
        req.setPageSize(4);
        req.setSortBy("plantName");
        req.setSortDirection("DESC");

        Page<UserPlants> page = new PageImpl<>(
                Arrays.asList(up1),
                PageRequest.of(3, 4, Sort.by(Sort.Direction.DESC, "plantName")),
                7 // total giả lập
        );

        when(userPlantRepository.findByUserId(eq(42L), any(Pageable.class))).thenReturn(page);

        UserPlantsSearchResponseDTO res = plantService.searchUserPlants(req);

        assertNotNull(res);
        assertEquals(1, res.getUserPlants().size());
        assertEquals(page.getTotalElements(), res.getTotalElements());  // <— sửa ở đây
        assertEquals(page.getTotalPages(), res.getTotalPages());
        assertEquals(3, res.getCurrentPage());
        assertEquals(4, res.getPageSize());

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(userPlantRepository, times(1)).findByUserId(eq(42L), pageableCaptor.capture());
        Pageable used = pageableCaptor.getValue();
        assertEquals(3, used.getPageNumber());
        assertEquals(4, used.getPageSize());
        assertEquals(Sort.Direction.DESC, used.getSort().getOrderFor("plantName").getDirection());

        verify(userPlantRepository, never()).findByUserIdAndPlantNameContainingIgnoreCase(anyLong(), anyString(), any());
        verify(userPlantRepository, never()).findByPlantNameContainingIgnoreCase(anyString(), any());
        verify(userPlantRepository, never()).findAll(any(Pageable.class));

        System.out.println("✅ searchUserPlants_emptyKeywordWithUserId_shouldBehaveAsUserOnly: PASSED");
    }
    @Test
    void searchUserPlants_allParamsEmpty_shouldUseFindAllWithDefaultSortAndPaging() {
        // request "empty": userId=null, keyword="" (rỗng), sortBy/sortDirection=null
        UserPlantsSearchRequestDTO req = new UserPlantsSearchRequestDTO();
        req.setUserId(null);
        req.setKeywordOfCommonName(""); // rỗng => không dùng keyword
        req.setPageNo(0);               // mặc định từ DTO
        req.setPageSize(10);            // mặc định từ DTO
        req.setSortBy(null);            // service fallback -> "plantName"
        req.setSortDirection(null);     // service fallback -> "ASC"

        Page<UserPlants> page = new PageImpl<>(
                Arrays.asList(up1, up2),
                PageRequest.of(0, 10, Sort.by(Sort.Direction.ASC, "plantName")),
                13
        );

        when(userPlantRepository.findAll(any(Pageable.class))).thenReturn(page);

        UserPlantsSearchResponseDTO res = plantService.searchUserPlants(req);

        assertNotNull(res);
        assertEquals(2, res.getUserPlants().size());
        assertEquals(page.getTotalElements(), res.getTotalElements());
        assertEquals(page.getTotalPages(), res.getTotalPages());
        assertEquals(0, res.getCurrentPage());
        assertEquals(10, res.getPageSize());

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(userPlantRepository, times(1)).findAll(pageableCaptor.capture());

        Pageable used = pageableCaptor.getValue();
        assertEquals(0, used.getPageNumber());
        assertEquals(10, used.getPageSize());
        assertEquals(Sort.Direction.ASC, used.getSort().getOrderFor("plantName").getDirection());

        // các nhánh khác không được gọi
        verify(userPlantRepository, never()).findByUserIdAndPlantNameContainingIgnoreCase(anyLong(), anyString(), any());
        verify(userPlantRepository, never()).findByUserId(anyLong(), any());
        verify(userPlantRepository, never()).findByPlantNameContainingIgnoreCase(anyString(), any());

        System.out.println("✅ searchUserPlants_allParamsEmpty_shouldUseFindAllWithDefaultSortAndPaging: PASSED");
    }

    @Test
    void searchUserPlants_invalidPaging_shouldThrow_whenNegativePageNo() {
        UserPlantsSearchRequestDTO req = new UserPlantsSearchRequestDTO();
        req.setUserId(null);
        req.setKeywordOfCommonName(null);
        req.setPageNo(-1);          // không hợp lệ
        req.setPageSize(10);
        req.setSortBy("plantName");
        req.setSortDirection("ASC");

        // PageRequest.of(-1, 10, ...) sẽ ném IllegalArgumentException
        assertThrows(IllegalArgumentException.class, () -> plantService.searchUserPlants(req));

        // Không được gọi repo nào
        verify(userPlantRepository, never()).findAll(any(Pageable.class));
        verify(userPlantRepository, never()).findByUserId(anyLong(), any());
        verify(userPlantRepository, never()).findByPlantNameContainingIgnoreCase(anyString(), any());
        verify(userPlantRepository, never()).findByUserIdAndPlantNameContainingIgnoreCase(anyLong(), anyString(), any());

        System.out.println("✅ searchUserPlants_invalidPaging_shouldThrow_whenNegativePageNo: PASSED");
    }

    @Test
    void searchUserPlants_invalidPaging_shouldThrow_whenZeroPageSize() {
        UserPlantsSearchRequestDTO req = new UserPlantsSearchRequestDTO();
        req.setUserId(null);
        req.setKeywordOfCommonName(null);
        req.setPageNo(0);
        req.setPageSize(0);         // không hợp lệ
        req.setSortBy("plantName");
        req.setSortDirection("ASC");

        // PageRequest.of(0, 0, ...) sẽ ném IllegalArgumentException
        assertThrows(IllegalArgumentException.class, () -> plantService.searchUserPlants(req));

        // Không được gọi repo nào
        verify(userPlantRepository, never()).findAll(any(Pageable.class));
        verify(userPlantRepository, never()).findByUserId(anyLong(), any());
        verify(userPlantRepository, never()).findByPlantNameContainingIgnoreCase(anyString(), any());
        verify(userPlantRepository, never()).findByUserIdAndPlantNameContainingIgnoreCase(anyLong(), anyString(), any());

        System.out.println("✅ searchUserPlants_invalidPaging_shouldThrow_whenZeroPageSize: PASSED");
    }


}
