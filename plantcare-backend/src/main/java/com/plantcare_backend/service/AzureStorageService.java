package com.plantcare_backend.service;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface AzureStorageService {
    /**
     * Upload file lên Azure Blob Storage
     */
    String uploadFile(MultipartFile file, String path) throws IOException;

    /**
     * Download file từ Azure Blob Storage
     */
    byte[] downloadFile(String blobUrl) throws IOException;

    /**
     * Xóa file từ Azure Blob Storage
     */
    void deleteFile(String blobUrl) throws IOException;

    /**
     * Tạo URL để truy cập file
     */
    String generateBlobUrl(String path);

    /**
     * Kiểm tra file có tồn tại không
     */
    boolean fileExists(String path);
}
