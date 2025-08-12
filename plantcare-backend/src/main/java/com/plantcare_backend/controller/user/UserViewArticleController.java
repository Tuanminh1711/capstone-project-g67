package com.plantcare_backend.controller.user;

import com.plantcare_backend.dto.response.Plants.PlantDetailResponseDTO;
import com.plantcare_backend.dto.response.Plants.UserPlantDetailResponseDTO;
import com.plantcare_backend.dto.response.base.ResponseData;
import com.plantcare_backend.dto.response.base.ResponseError;
import com.plantcare_backend.dto.response.expert.ArticleDetailResponseDTO;
import com.plantcare_backend.dto.response.expert.ArticleResponseDTO;
import com.plantcare_backend.exception.ResourceNotFoundException;
import com.plantcare_backend.service.UserViewArticleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/user_articles")
@Slf4j
@Tag(name = "User Controller")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200/")
public class UserViewArticleController {

    private final UserViewArticleService userViewArticleService;

    @GetMapping("/get_list_articles")
    @Operation(method = "GET", summary = "Get all articles", description = "Get paginated list of all articles from all experts")
    public ResponseData<Page<ArticleResponseDTO>> getListArticles(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        log.info("Request get articles from all experts, page: {}, size: {}", page, size);

        try {
            Page<ArticleResponseDTO> articles = userViewArticleService.getAllArticles(page, size);
            return new ResponseData<>(HttpStatus.OK.value(), "Get articles successfully", articles);
        } catch (Exception e) {
            log.error("Get articles failed", e);
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), "Get articles failed: " + e.getMessage());
        }
    }


    @GetMapping("/detail/{id}")
    public ResponseData<ArticleDetailResponseDTO> getArticleDetail(@PathVariable Long id) {
        ArticleDetailResponseDTO fullDto = userViewArticleService.getArticleDetail(id);
        if (!"PUBLISHED".equals(fullDto.getStatus().toString())) {
            throw new ResourceNotFoundException("Article not available");
        }
        ArticleDetailResponseDTO userDto = userViewArticleService.toArticleDetailDTO(fullDto);
        return new ResponseData<>(HttpStatus.OK.value(), "Get article detail successfully", userDto);
    }
}
