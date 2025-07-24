package com.plantcare_backend.service;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Service for logging all user activities
 */
public interface ActivityLogService {

    /**
     * Log user activity
     * 
     * @param userId      User ID
     * @param action      Action type (e.g., LOGIN, CREATE_PLANT, UPDATE_PROFILE,
     *                    etc.)
     * @param description Activity description
     * @param request     HTTP request for IP address
     */
    void logActivity(int userId, String action, String description, HttpServletRequest request);

    /**
     * Log user activity with custom IP address
     * 
     * @param userId      User ID
     * @param action      Action type
     * @param description Activity description
     * @param ipAddress   Custom IP address
     */
    void logActivity(int userId, String action, String description, String ipAddress);

    /**
     * Log user activity without IP address
     * 
     * @param userId      User ID
     * @param action      Action type
     * @param description Activity description
     */
    void logActivity(int userId, String action, String description);
}