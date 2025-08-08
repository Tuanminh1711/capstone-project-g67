package com.plantcare_backend.service.vip;

import com.plantcare_backend.model.VipOrder;
import com.plantcare_backend.model.VipSubscription;

import java.util.List;

public interface VipSubscriptionService {
    VipSubscription createSubscription(VipOrder order);

    VipSubscription getSubscriptionByUserId(Integer userId);

    VipSubscription extendSubscription(Integer userId, VipOrder.SubscriptionType subscriptionType);

    void cancelSubscription(Integer userId);

    List<VipSubscription> getExpiredSubscriptions();

    void processExpiredSubscriptions();

    boolean isUserVipActive(Integer userId);

    VipSubscription getActiveSubscription(Integer userId);

}
