# CareSync Backend - PostgreSQL Setup

## Database Configuration

This project uses PostgreSQL for both development and production environments.

### Production (Supabase)
- Uses `DATABASE_URL` environment variable
- Automatically connects to Supabase PostgreSQL
- SSL enabled for security

### Development (Local PostgreSQL)
- Requires local PostgreSQL installation
- Uses individual connection parameters
- Creates database automatically if it doesn't exist

## Environment Variables

### Production (.env.vercel)
```bash
DATABASE_URL=postgresql://username:password@host:port/database
# ... other variables
```

### Development (.env)
```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=caresync_dev
DB_USER=postgres
DB_PASSWORD=password
# ... other variables
```

## Database Setup

### For Development:
1. Install PostgreSQL locally
2. Create a database user (optional)
3. Run setup script:
   ```bash
   npm run setup-db
   ```

### For Production:
1. Set up Supabase project
2. Get DATABASE_URL from Supabase dashboard
3. Add to Vercel environment variables
4. Deploy - tables are created automatically

## Migration Commands

```bash
# Run migrations
npm run migrate

# Seed database
npm run seed
```

## Database Schema

The application creates the following tables:
- `users` - User accounts with encrypted PII
- `medications` - Medication records
- `prescriptions` - Prescription details
- `adherence` - Medication adherence tracking
- `devices` - Connected medical devices
- `notifications` - User notifications
- `audit_logs` - Security audit logs
- `consent_logs` - User consent tracking