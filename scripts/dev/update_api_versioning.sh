#!/bin/bash

# Update PaymentController
sed -i.bak '/@RequestMapping/s|@RequestMapping("/api/payment")|@RequestMapping({ApiVersionConfig.V1 + "/payment", ApiVersionConfig.LEGACY + "/payment"})|' payment-service/src/main/java/com/MaSoVa/payment/controller/PaymentController.java
sed -i.bak '/^import org.springframework.web.bind.annotation.\*/a\
import com.MaSoVa.shared.config.ApiVersionConfig;' payment-service/src/main/java/com/MaSoVa/payment/controller/PaymentController.java

# Update MenuController  
sed -i.bak '/@RequestMapping/s|@RequestMapping("/api/menu")|@RequestMapping({ApiVersionConfig.V1 + "/menu", ApiVersionConfig.LEGACY + "/menu"})|' menu-service/src/main/java/com/MaSoVa/menu/controller/MenuController.java
sed -i.bak '/^import org.springframework.web.bind.annotation.\*/a\
import com.MaSoVa.shared.config.ApiVersionConfig;' menu-service/src/main/java/com/MaSoVa/menu/controller/MenuController.java

# Update UserController
sed -i.bak '/@RequestMapping/s|@RequestMapping("/api/users")|@RequestMapping({ApiVersionConfig.V1 + "/users", ApiVersionConfig.LEGACY + "/users"})|' user-service/src/main/java/com/MaSoVa/user/controller/UserController.java
sed -i.bak '/^import org.springframework.web.bind.annotation.\*/a\
import com.MaSoVa.shared.config.ApiVersionConfig;' user-service/src/main/java/com/MaSoVa/user/controller/UserController.java

# Update DeliveryControllers (already done in previous edits)
# Update AnalyticsController
sed -i.bak '/@RequestMapping/s|@RequestMapping("/api/analytics")|@RequestMapping({ApiVersionConfig.V1 + "/analytics", ApiVersionConfig.LEGACY + "/analytics"})|' analytics-service/src/main/java/com/MaSoVa/analytics/controller/AnalyticsController.java
sed -i.bak '/^import org.springframework.web.bind.annotation.\*/a\
import com.MaSoVa.shared.config.ApiVersionConfig;' analytics-service/src/main/java/com/MaSoVa/analytics/controller/AnalyticsController.java

echo "API versioning updates applied"
