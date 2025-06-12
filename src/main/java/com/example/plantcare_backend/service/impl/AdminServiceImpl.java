package com.example.plantcare_backend.service.impl;

import com.example.plantcare_backend.model.Users;
import com.example.plantcare_backend.repository.UserRepository;
import com.example.plantcare_backend.service.AdminService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AdminServiceImpl implements AdminService {

    private static final Logger log = LoggerFactory.getLogger(AdminServiceImpl.class);

    @Autowired
    private UserRepository userRepository;

    @Override
    public void changeStatus(int userId, UserStatus status) {
        Users user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setStatus(Users.UserStatus.valueOf(status.name()));
        userRepository.save(user);

        log.info("User status changed successfully for user ID: {}", userId);
    }
}