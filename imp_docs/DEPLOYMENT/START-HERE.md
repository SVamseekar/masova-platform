# 🚀 START HERE - MaSoVa Update System Setup

## ⚡ Quick Start (30 Minutes Total)

Your automated update system is **99% ready**! Just need to configure it with your details.

---

## 📋 What You Need

Before starting, make sure you have:
- [ ] Docker Hub account (sign up: https://hub.docker.com/signup) - **FREE**
- [ ] GitHub repository for this project
- [ ] 30 minutes of time

---

## 🎯 Step-by-Step Setup

### **Option 1: Guided Setup (Easiest)** ⭐

Run the setup wizard:

```bash
./setup-update-system.sh
```

The script will ask you for:
1. Your Docker Hub username
2. Your GitHub username
3. Check that Java, Maven, and Docker are installed

Then follow the on-screen instructions!

---

### **Option 2: Manual Setup**

If you prefer to do it manually:

#### 1. Edit Configuration

```bash
vim .masova-config
```

Update these two lines:
```bash
DOCKER_HUB_USERNAME=your-dockerhub-username
GITHUB_USERNAME=your-github-username
```

Save and exit.

#### 2. Test Build

```bash
./build-monolith.sh --skip-tests --version=1.0.0
```

Should take 5-10 minutes and create `masova-monolith/` folder.

#### 3. Setup GitHub Secrets

1. Get Docker Hub token:
   - Go to: https://hub.docker.com/settings/security
   - Create new access token

2. Add to GitHub:
   - Go to: https://github.com/YOUR_USERNAME/masova/settings/secrets/actions
   - Add `DOCKER_USERNAME` = your Docker Hub username
   - Add `DOCKER_PASSWORD` = the token you just created

#### 4. Create First Release

```bash
git add .
git commit -m "Setup update system"
git push
git tag v1.0.0
git push origin v1.0.0
```

Watch the magic happen at:
https://github.com/YOUR_USERNAME/masova/actions

---

## 📚 Detailed Documentation

After setup, explore these docs (in this order):

1. **SETUP-INSTRUCTIONS.md** - Complete setup guide
2. **UPDATE-SYSTEM-SUMMARY.md** - System overview
3. **QUICK-START-UPDATE-SYSTEM.md** - Usage guide
4. **UPDATE-SYSTEM-CHECKLIST.md** - Verification checklist

---

## ✅ Success Criteria

You'll know it's working when:

✅ `./build-monolith.sh` completes without errors
✅ `masova-monolith/` folder created with .jar files
✅ GitHub Actions runs successfully (green checkmark)
✅ Docker images appear on Docker Hub
✅ GitHub Release v1.0.0 is created

---

## 🆘 Need Help?

**Build fails?**
```bash
# Check prerequisites
java -version  # Should be 17+
mvn --version  # Should be 3.x
docker --version
```

**GitHub Actions fails?**
- Check secrets are added correctly
- Verify usernames match exactly

**Still stuck?**
- Read SETUP-INSTRUCTIONS.md
- Check UPDATE-SYSTEM-SUMMARY.md
- Review error logs

---

## 🎯 What Happens After Setup?

Once configured, your workflow becomes:

```bash
# 1. Fix a bug
cd order-service
vim src/.../OrderService.java

# 2. Release it
git commit -m "Fix: Order status bug"
git push
git tag v1.0.1
git push origin v1.0.1

# 3. Wait 15 minutes
# GitHub Actions automatically:
# - Builds everything
# - Creates Docker images
# - Pushes to Docker Hub
# - Creates release

# 4. Customers update
./update-masova.sh
# 3 minutes later: ✅ Done!
```

**Total time from bug fix to customer: 20 minutes**
**Your effort: 3 commands**
**Cost: $0**

---

## 🚀 Ready? Let's Go!

**Run this now:**

```bash
./setup-update-system.sh
```

Or read **SETUP-INSTRUCTIONS.md** for manual setup.

---

**Let's ship some updates!** 🎉
