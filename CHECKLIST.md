# ✅ Quick Deployment Checklist

Use this checklist when you wake up to quickly verify deployment status.

---

## 1️⃣ Check GitHub Actions
- [ ] Go to: https://github.com/veangdev/subscription-backend/actions
- [ ] Find latest "Deploy to Cloud Run" workflow
- [ ] Status: ✅ Green / 🟡 Running / ❌ Red

**If Green**: Skip to step 5 ✅  
**If Red**: Continue to step 2 ⚠️

---

## 2️⃣ Open Cloud Shell
- [ ] Go to: https://shell.cloud.google.com/
- [ ] Click "Activate Cloud Shell" button

---

## 3️⃣ Clone Repo & Run Status Check
```bash
git clone https://github.com/veangdev/subscription-backend.git
cd subscription-backend
chmod +x scripts/check-deployment.sh
./scripts/check-deployment.sh
```

- [ ] Script ran successfully
- [ ] Note any errors shown

---

## 4️⃣ If Script Shows Errors
The script will offer to auto-fix. Choose Yes.

Or manually run:
```bash
chmod +x scripts/emergency-fix.sh
./scripts/emergency-fix.sh
```

- [ ] Emergency fix completed
- [ ] Go back to GitHub Actions and re-run workflow

---

## 5️⃣ Test the Deployed Service
```bash
# Get service URL
SERVICE_URL=$(gcloud run services describe subscription-backend \
  --region=us-central1 \
  --project=box-subscription-system \
  --format="value(status.url)")

# Test health endpoint
curl "${SERVICE_URL}/health"
```

Expected result:
```json
{"status":"ok","environment":"production","uptime":"...","timestamp":"..."}
```

- [ ] Health endpoint returns 200 OK
- [ ] Response shows "status": "ok"

---

## 6️⃣ Verify API Endpoints

```bash
# API info
curl "${SERVICE_URL}/api"

# API docs (open in browser)
echo "${SERVICE_URL}/api/docs"
```

- [ ] API info endpoint works
- [ ] API docs accessible

---

## ✅ SUCCESS!

If all checkboxes above are checked, your deployment is successful! 🎉

**Service URL**: (copy from above)
**Health**: `${SERVICE_URL}/health`
**API Docs**: `${SERVICE_URL}/api/docs`

---

## ⚠️ STILL HAVING ISSUES?

### Most Common Issues:

**Issue**: Service account permission denied
**Fix**: Run `./scripts/emergency-fix.sh` in Cloud Shell

**Issue**: Cloud SQL API not enabled
**Fix**: 
```bash
gcloud services enable sqladmin.googleapis.com --project=box-subscription-system
```

**Issue**: Secret not found
**Fix**: Create missing secrets:
```bash
# Example for database-password
echo -n "YOUR_PASSWORD" | gcloud secrets create database-password \
  --data-file=- --project=box-subscription-system
```

**Issue**: Container still timing out
**Fix**: Check logs for specific error:
```bash
gcloud run services logs read subscription-backend \
  --region=us-central1 --project=box-subscription-system --limit=100
```

### Need More Help?
Read these files in the repo:
- `WAKE_UP_SUMMARY.md` - Complete summary of changes
- `README_DEPLOYMENT.md` - Comprehensive deployment guide
- `CLOUDRUN_TROUBLESHOOTING.md` - Detailed troubleshooting
- `QUICK_SETUP.md` - Quick manual setup commands

---

**Total Time to Check**: ~5 minutes  
**Likelihood of Success**: Very High ✅

All critical fixes have been applied. Most common failure points are addressed by auto-fix scripts.
