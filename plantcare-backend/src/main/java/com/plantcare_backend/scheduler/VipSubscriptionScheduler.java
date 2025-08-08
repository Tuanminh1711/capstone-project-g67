package com.plantcare_backend.scheduler;

import com.plantcare_backend.model.VipSubscription;
import com.plantcare_backend.service.vip.VipSubscriptionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Slf4j
public class VipSubscriptionScheduler {
    @Autowired
    private VipSubscriptionService vipSubscriptionService;

    // Chạy mỗi giờ để kiểm tra và xử lý VIP subscriptions hết hạn
    @Scheduled(cron = "0 0 */6 * * ?")
    public void processExpiredVipSubscriptions() {
        try {
            log.info("Starting VIP subscription expiration check...");

            List<VipSubscription> expiredSubscriptions = vipSubscriptionService.getExpiredSubscriptions();
            int processedCount = expiredSubscriptions.size();

            if (processedCount > 0) {
                vipSubscriptionService.processExpiredSubscriptions();
                log.info("Completed processing {} expired VIP subscriptions", processedCount);
            } else {
                log.info("No expired VIP subscriptions found");
            }

        } catch (Exception e) {
            log.error("Critical error in VIP subscription scheduler", e);
        }
    }

    // Chạy mỗi ngày lúc 8:00 sáng để gửi thông báo sắp hết hạn
    @Scheduled(cron = "0 0 8 * * ?")
    public void sendExpirationReminders() {
        try {
            log.info("Starting VIP subscription expiration reminders...");

            // TODO: Implement logic to send reminders for subscriptions expiring in next 7 days
            // This can be implemented in VipSubscriptionService

            log.info("Completed sending VIP subscription expiration reminders");

        } catch (Exception e) {
            log.error("Critical error in VIP subscription reminder scheduler", e);
        }
    }
}
