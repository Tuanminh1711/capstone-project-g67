package com.plantcare_backend.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/plants-reprot")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Plant report Controller", description = "APIs for plant report and management")
@CrossOrigin(origins = "http://localhost:4200/")
public class PlantReportController {

}
