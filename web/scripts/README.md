# Database Initialization Scripts

## MongoDB Schema Setup

Better-auth's MongoDB adapter doesn't support CLI schema generation because MongoDB is schema-less. Instead, we use a manual initialization script.

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

This will install `tsx` (TypeScript executor) needed to run the initialization script.

### 2. Set Environment Variables

Make sure you have a `.env.local` file with:

```env
MONGODB_URI=mongodb://localhost:27017
DB_NAME=myDatabase
```

### 3. Initialize Database Collections

Run the initialization script:

```bash
npm run init-db
```

This will:
- Connect to your MongoDB database
- Create required collections: `user`, `session`, `account`, `verification`
- Create necessary indexes for better performance
- Set up TTL indexes for automatic expiration of sessions and verifications

### 4. Verify Setup

After running the script, you should see:
```
✓ Created collection: user
✓ Created collection: session
✓ Created collection: account
✓ Created collection: verification
✓ Created indexes on user collection
✓ Created indexes on session collection
✓ Created indexes on account collection
✓ Created indexes on verification collection

✅ Database initialization complete!
```

## Alternative: Auto-Creation

Better-auth will also automatically create collections on first use if they don't exist. However, running the initialization script ensures:
- Proper indexes are created from the start
- Better performance from day one
- No delays on first authentication requests

## Troubleshooting

If you encounter connection errors:
1. Ensure MongoDB is running: `mongod` or your MongoDB service
2. Check `MONGODB_URI` in `.env.local`
3. Verify network connectivity to MongoDB instance
4. Check MongoDB logs for connection issues

