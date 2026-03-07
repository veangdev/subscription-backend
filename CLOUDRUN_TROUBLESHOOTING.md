# Cloud Run Deployment Troubleshooting

## Recent Changes

### Database Connection Optimizations
1. **Removed DATABASE_PORT** for Unix socket connections (Cloud SQL doesn't use ports with Unix sockets)
2. **Reduced retry attempts** to 1 retry × 1 second = faster failure/success
3. **Shortened connection timeout** to 5 seconds for faster startup
4. **Increased Cloud Run resources**:
   - Memory: 512Mi → 1Gi
   - CPU: 1 → 2
   - Added CPU boost for faster cold starts
5. **Enhanced logging** to diagnose startup issues

### Database Connection Format
For Cloud SQL with Unix sockets on Cloud Run:
```bash
DATABASE_HOST=/cloudsql/PROJECT_ID:REGION:INSTANCE
# NO DATABASE_PORT needed!
```

## Troubleshooting Steps

### 1. Check Cloud Run Logs
```bash
# Use the helper script (replace PROJECT_ID)
./scripts/check-cloudrun-logs.sh YOUR_PROJECT_ID us-central1

# Or directly with gcloud
gcloud run services logs read subscription-backend \
  --project=YOUR_PROJECT_ID \
  --region=us-central1 \
  --limit=100
```

### 2. Verify Service Account Permissions
The service account needs these roles:
- `roles/cloudsql.client` - To connect to Cloud SQL via Unix socket
- `roles/run.developer` - To deploy to Cloud Run

Check permissions:
```bash
# Replace with your project ID and service account email
gcloud projects get-iam-policy YOUR_PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com"
```

Add missing role:
```bash
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"
```

### 3. Verify Cloud SQL Instance
```bash
# Check instance exists and get connection name
gcloud sql instances describe subscription-db \
  --project=YOUR_PROJECT_ID \
  --format="value(connectionName)"

# Should output: YOUR_PROJECT_ID:us-central1:subscription-db
```

### 4. Verify Database Credentials
Check that the Secret Manager secrets exist and have correct values:
```bash
# List secrets
gcloud secrets list --project=YOUR_PROJECT_ID

# View secret metadata (not the actual value)
gcloud secrets describe database-password --project=YOUR_PROJECT_ID
```

### 5. Enable Required APIs
```bash
# Enable Cloud SQL Admin API
gcloud services enable sqladmin.googleapis.com --project=YOUR_PROJECT_ID

# Enable Cloud SQL API
gcloud services enable sql-component.googleapis.com --project=YOUR_PROJECT_ID

# Enable Secret Manager API
gcloud services enable secretmanager.googleapis.com --project=YOUR_PROJECT_ID
```

### 6. Test Database Connection Locally
You can test the database connection using Cloud SQL Proxy:
```bash
# Download Cloud SQL Proxy
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.darwin.arm64
chmod +x cloud-sql-proxy

# Run proxy
./cloud-sql-proxy YOUR_PROJECT_ID:us-central1:subscription-db

# In another terminal, test connection
psql "host=127.0.0.1 port=5432 dbname=subscription_db user=nestjs_user"
```

## Common Issues

### Issue: "Container failed to start and listen on port 8080"
**Causes:**
1. Database connection hanging during startup
2. Missing service account permissions
3. Incorrect database credentials
4. Cloud SQL instance not running

**Solutions:**
- Check logs for actual error message (see step 1 above)
- Verify service account has `roles/cloudsql.client` role
- Confirm database password in Secret Manager is correct
- Ensure Cloud SQL instance is running: `gcloud sql instances list`

### Issue: "Cloud SQL API not activated"
**Solution:**
```bash
gcloud services enable sqladmin.googleapis.com --project=YOUR_PROJECT_ID
gcloud services enable sql-component.googleapis.com --project=YOUR_PROJECT_ID
```

### Issue: "Failed to authenticate"
**Solution:**
- Verify `GCP_SA_KEY` secret in GitHub repository settings contains valid service account JSON key
- Check service account has required roles

## Expected Log Output on Successful Startup

```
[Nest] INFO [Bootstrap] Bootstrapping application in production mode
[Nest] INFO [Bootstrap] Database host: /cloudsql/PROJECT:REGION:INSTANCE
[Nest] INFO [Bootstrap] Database name: subscription_db
[Nest] INFO [Bootstrap] Database user: nestjs_user
[Nest] INFO [Bootstrap] PORT: 8080
[Nest] INFO [Bootstrap] DB_RETRY_ATTEMPTS: 1
[Nest] INFO [Bootstrap] DB_CONNECTION_TIMEOUT_MS: 5000
[Nest] INFO [Bootstrap] Creating Nest application...
[Nest] INFO [TypeOrmModule] Successfully connected to database
[Nest] INFO [Bootstrap] Nest application created successfully
[Nest] INFO [Bootstrap] Application configuration complete
[Nest] INFO [Bootstrap] Binding HTTP server to 0.0.0.0:8080
[Nest] INFO [Bootstrap] ✓ Application is running on port 8080
```

## Next Steps After Deployment Success

1. Test the API:
```bash
# Get service URL
gcloud run services describe subscription-backend \
  --region=us-central1 \
  --format="value(status.url)"

# Test health endpoint
curl https://YOUR-SERVICE-URL/health
```

2. Monitor logs in real-time:
```bash
gcloud run services logs tail subscription-backend \
  --region=us-central1 \
  --project=YOUR_PROJECT_ID
```
