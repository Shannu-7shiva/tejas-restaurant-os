# AURELIA RESTAURANT OS - BACKUP & RECOVERY PROCEDURES

## 1. Automated PostgreSQL Daily Backup Script

Create a cron backup script at `/usr/local/bin/aurelia-db-backup.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/aurelia"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DATABASE_NAME="aurelia_os"
DATABASE_USER="aurelia_user"

mkdir -p "$BACKUP_DIR"
pg_dump -U "$DATABASE_USER" -F c -b -v -f "$BACKUP_DIR/${DATABASE_NAME}_${TIMESTAMP}.dump" "$DATABASE_NAME"

# Delete backups older than 30 days
find "$BACKUP_DIR" -type f -name "*.dump" -mtime +30 -delete
```

Schedule daily backup at 03:00 AM UTC via cron:
```bash
0 3 * * * /usr/local/bin/aurelia-db-backup.sh
```

---

## 2. Restoring from a Backup
To restore a snapshot into PostgreSQL:
```bash
pg_restore -U aurelia_user -d aurelia_os -v -c /var/backups/aurelia/aurelia_os_20261013_030000.dump
```

---

## 3. SQLite Development Database Backup
If running locally with SQLite:
```bash
cp aurelia.db "aurelia_backup_$(date +%Y%m%d).db"
```
