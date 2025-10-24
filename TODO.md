# TODO: Fix PostgreSQL Connection Issues

- [x] Increase connectionTimeoutMillis in db.js from 2000 to 10000
- [x] Reduce max connections in pool to 5 (Supabase free tier limit)
- [x] Add retry logic to testDatabaseConnection
- [ ] Restart the backend server
- [ ] Test database connection
