# Brevo Email Service - Quick Start Guide

## ✅ Step 1: API Key (DONE!)
You've already created your Brevo API key! 🎉

## 📧 Step 2: Verify Sender Email (DO THIS NOW!)

Go to: https://app.brevo.com/senders

**Quick Option (2 minutes):**
1. Click "Add a new sender"
2. Use your **personal email** (Gmail, etc.)
3. Enter your name
4. Click verification link in your email
5. ✅ Done!

## 🧪 Step 3: Test API Key (Quick Test)

Replace YOUR_API_KEY and YOUR_EMAIL, then run:

```bash
curl --request POST \
  --url https://api.brevo.com/v3/smtp/email \
  --header 'accept: application/json' \
  --header 'api-key: YOUR_BREVO_API_KEY_HERE' \
  --header 'content-type: application/json' \
  --data '{
    "sender": {"name": "MaSoVa Test", "email": "YOUR_VERIFIED_EMAIL"},
    "to": [{"email": "YOUR_EMAIL"}],
    "subject": "Brevo Test",
    "htmlContent": "<h1>Success! Brevo is working!</h1>"
  }'
```

**If you see messageId → Check your email! ✅**

## 🔧 Step 4: Configure Notification Service

Create `.env` file:

```bash
cd notification-service

cat > .env << 'ENVEOF'
BREVO_API_KEY=your-api-key-here
BREVO_FROM_EMAIL=your-verified-email@gmail.com
BREVO_FROM_NAME=MaSoVa Test
BREVO_ENABLED=true

REDIS_HOST=localhost
REDIS_PORT=6379
MONGODB_URI=mongodb://localhost:27017/masova-notification
JWT_SECRET=MaSoVa-secret-key-for-jwt-token-generation-very-long-key-must-be-at-least-256-bits-for-production-security
ENVEOF
```

**Edit with your values!**

## 🏃 Step 5: Start Services

```bash
# Start Redis
brew services start redis
redis-cli ping  # Should say PONG

# Start MongoDB  
brew services start mongodb-community
mongosh --eval "db.version()"

# Start notification-service
cd notification-service
mvn spring-boot:run
```

## ✉️ Step 6: Send Test Email

```bash
curl -X POST http://localhost:8092/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-123",
    "title": "Test from MaSoVa",
    "message": "<h1>Hello!</h1><p>Brevo integration works!</p>",
    "type": "SYSTEM_ALERT",
    "channel": "EMAIL",
    "recipientEmail": "YOUR_EMAIL@gmail.com"
  }'
```

## ✅ Verify Success

1. Check email inbox (might be in spam)
2. Check Redis: `redis-cli GET "brevo:email:count:$(date +%Y-%m-%d)"`
3. Check Brevo: https://app.brevo.com/statistics

## 🐛 Troubleshooting

**"Sender not verified"** → Go verify at https://app.brevo.com/senders
**"Invalid API key"** → Check your .env file
**"Connection refused"** → Start Redis/MongoDB

---

🎯 **Next Step:** Go to https://app.brevo.com/senders and verify your email!
