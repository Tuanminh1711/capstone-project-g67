package com.plantcare_backend.service.impl;

import com.azure.storage.blob.BlobClient;
import com.azure.storage.blob.BlobContainerClient;
import com.azure.storage.blob.BlobServiceClient;
import com.azure.storage.blob.BlobServiceClientBuilder;
import com.plantcare_backend.service.external_service.AzureStorageService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@Service
@Slf4j
public class AzureStorageServiceImpl implements AzureStorageService {
    @Value("${azure.storage.connection-string}")
    private String connectionString;

    @Value("${azure.storage.container-name}")
    private String containerName;

    @Value("${azure.storage.blob-endpoint}")
    private String blobEndpoint;

    private BlobServiceClient blobServiceClient;
    private BlobContainerClient containerClient;

    private BlobServiceClient getBlobServiceClient() {
        if (blobServiceClient == null) {
            blobServiceClient = new BlobServiceClientBuilder()
                    .connectionString(connectionString)
                    .buildClient();
        }
        return blobServiceClient;
    }

    private BlobContainerClient getContainerClient() {
        if (containerClient == null) {
            containerClient = getBlobServiceClient().getBlobContainerClient(containerName);
        }
        return containerClient;
    }

    @Override
    public String uploadFile(MultipartFile file, String path) throws IOException {
        try {

            // Tạo unique filename nếu cần
            String fileName = UUID.randomUUID().toString() + getFileExtension(file.getOriginalFilename());
            String fullPath = path + "/" + fileName;

            BlobClient blobClient = getContainerClient().getBlobClient(fullPath);

            // Upload file
            blobClient.upload(file.getInputStream(), file.getSize(), true);

            // Trả về URL
            String blobUrl = blobClient.getBlobUrl();
            log.info("File uploaded successfully: {}", blobUrl);

            return blobUrl;

        } catch (Exception e) {
            log.error("Error uploading file to Azure: {}", e.getMessage(), e);
            throw new IOException("Failed to upload file to Azure", e);
        }
    }

    @Override
    public byte[] downloadFile(String blobUrl) throws IOException {
        try {
            log.info("Downloading file from Azure: {}", blobUrl);

            String blobName = extractBlobNameFromUrl(blobUrl);
            BlobClient blobClient = getContainerClient().getBlobClient(blobName);

            if (!blobClient.exists()) {
                throw new IOException("File not found: " + blobUrl);
            }

            return blobClient.downloadContent().toBytes();

        } catch (Exception e) {
            log.error("Error downloading file from Azure: {}", e.getMessage(), e);
            throw new IOException("Failed to download file from Azure", e);
        }
    }

    @Override
    public void deleteFile(String blobUrl) throws IOException {
        try {
            log.info("Deleting file from Azure: {}", blobUrl);

            String blobName = extractBlobNameFromUrl(blobUrl);
            BlobClient blobClient = getContainerClient().getBlobClient(blobName);

            if (blobClient.exists()) {
                blobClient.delete();
                log.info("File deleted successfully: {}", blobUrl);
            } else {
                log.warn("File not found for deletion: {}", blobUrl);
            }

        } catch (Exception e) {
            log.error("Error deleting file from Azure: {}", e.getMessage(), e);
            throw new IOException("Failed to delete file from Azure", e);
        }
    }

    @Override
    public String generateBlobUrl(String path) {
        return getContainerClient().getBlobClient(path).getBlobUrl();
    }

    @Override
    public boolean fileExists(String path) {
        return getContainerClient().getBlobClient(path).exists();
    }

    private String getFileExtension(String filename) {
        if (filename == null || filename.lastIndexOf(".") == -1) {
            return "";
        }
        return filename.substring(filename.lastIndexOf("."));
    }

    private String extractBlobNameFromUrl(String blobUrl) {
        // Extract blob name from full URL
        // Example: https://account.blob.core.windows.net/container/path/file.jpg
        // Return: path/file.jpg
        String[] parts = blobUrl.split("/");
        if (parts.length > 4) {
            StringBuilder blobName = new StringBuilder();
            for (int i = 4; i < parts.length; i++) {
                if (i > 4) blobName.append("/");
                blobName.append(parts[i]);
            }
            return blobName.toString();
        }
        return blobUrl;
    }
}
