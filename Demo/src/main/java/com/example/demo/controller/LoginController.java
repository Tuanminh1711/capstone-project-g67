package com.example.demo.controller;

import com.example.demo.dto.request.AccountRequestDTO;
import com.example.demo.dto.response.AccountRepository;
import com.example.demo.dto.response.ResponseData;
import com.example.demo.model.accounts;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

/**
 * Create Ta Hoang
 */
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:4200/")
public class LoginController {

  private final AccountRepository accountRepository;
  private final BCryptPasswordEncoder passwordEncoder;

  public LoginController(AccountRepository accountRepository) {
    this.accountRepository = accountRepository;
    this.passwordEncoder = new BCryptPasswordEncoder();
  }

  @PostMapping("/login")
  public ResponseData<?> authenticateUser(@Valid @RequestBody AccountRequestDTO accountRequestDTO) {
    accounts account = accountRepository.findByUsername(accountRequestDTO.getUsername());
    if (account != null && passwordEncoder.matches(accountRequestDTO.getPassword(), account.getPassword())) {
      System.out.println("==> success: " + accountRequestDTO.getUsername());
      return new ResponseData<>(HttpStatus.ACCEPTED.value(), "Login successful");
    }
    System.out.println("==> fail: " + accountRequestDTO.getUsername());
    return new ResponseData<>(HttpStatus.EXPECTATION_FAILED.value(), "Login failed");
  }

  // account != null && passwordEncoder.matches(accountRequestDTO.getPassword(),
  // account.getPassword())
  @PostMapping("/register")
  public ResponseData<?> registerUser(@Valid @RequestBody AccountRequestDTO accountRequestDTO) {
    if (accountRepository.findByUsername(accountRequestDTO.getUsername()) != null) {
      return new ResponseData<>(HttpStatus.CONFLICT.value(), "Username already exists");
    }
    String encodedPassword = passwordEncoder.encode(accountRequestDTO.getPassword());

    accounts newAccount = new accounts();
    newAccount.setUsername(accountRequestDTO.getUsername());
    newAccount.setPassword(encodedPassword);
    newAccount.setActive(true);
    newAccount.setCreatedAt(new java.util.Date());

    accountRepository.save(newAccount);

    return new ResponseData<>(HttpStatus.CREATED.value(), "Register successful");
  }
}
