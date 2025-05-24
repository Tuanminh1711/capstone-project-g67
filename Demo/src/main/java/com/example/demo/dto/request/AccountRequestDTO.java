package com.example.demo.dto.request;

import jakarta.validation.constraints.NotBlank;

import java.io.Serializable;

public class AccountRequestDTO implements Serializable {
  @NotBlank(message = "Username must be not blank")
  private String username;

  @NotBlank(message = "Password must be not blank")
  private String password;

  private String email;

  public AccountRequestDTO() {
  }

  public AccountRequestDTO(String username, String password, String email) {
    this.username = username;
    this.password = password;
    this.email = email;
  }

  public AccountRequestDTO(String username, String password) {
    this.username = username;
    this.password = password;
  }

  public String getUsername() {
    return username;
  }

  public String getPassword() {
    return password;
  }

  public void setUsername(String username) {
    this.username = username;
  }

  public void setPassword(String password) {
    this.password = password;
  }

  public String getEmail() {
    return email;
  }

  public void setEmail(String email) {
    this.email = email;
  }
}
