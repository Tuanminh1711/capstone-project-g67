package com.example.plantcare_backend.controller;


import com.example.plantcare_backend.dto.reponse.ResponseData;
import com.example.plantcare_backend.dto.reponse.ResponseError;
import com.example.plantcare_backend.dto.request.UserRequestDTO;
import com.example.plantcare_backend.service.UserService;
import com.example.plantcare_backend.util.Translator;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Create by TaHoang
 */

@RestController
@RequestMapping("/api/user")
@Slf4j
@Tag(name = "User Controller")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @Operation(method = "POST", summary = "Add new user", description = "Send a request via this API to create new user")
    @PostMapping(value = "/")
    public ResponseData<Long> addUser(@Valid @RequestBody UserRequestDTO userRequestDTO) {
        log.info("Request add user, {} {}", userRequestDTO.getUsername(), userRequestDTO.getPassword());

        try {
            long userId = userService.saveUser(userRequestDTO);
            return new ResponseData<>(HttpStatus.CREATED.value(), Translator.toLocale("user.add.success"), userId);
        } catch (Exception e) {
            log.error("add user failed", e);
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), "Add user fail");
        }
    }
}
