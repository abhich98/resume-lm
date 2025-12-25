#!/usr/bin/env python3
"""
scripts/create_pro_subscription.py

Create or update a 'pro' subscription row for a given user_id in the local
development database. This is intended for development/testing only.

Usage:
  pip install psycopg2-binary
  DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
    python3 scripts/create_pro_subscription.py --user-id <user-uuid> --days 30

WARNING: Do NOT run against production databases.
"""
from __future__ import annotations

import os
import sys
import uuid
import argparse
from datetime import datetime, timedelta
from typing import Optional

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
except Exception as e:
    print("Missing dependency: psycopg2-binary. Install with: pip install psycopg2-binary")
    raise


INSERT_OR_UPDATE_SQL = """
INSERT INTO subscriptions
  (user_id, stripe_subscription_id, stripe_customer_id, subscription_plan,
   subscription_status, current_period_end, trial_end, created_at, updated_at)
VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
ON CONFLICT (user_id) DO UPDATE
  SET stripe_subscription_id = EXCLUDED.stripe_subscription_id,
      stripe_customer_id = EXCLUDED.stripe_customer_id,
      subscription_plan = EXCLUDED.subscription_plan,
      subscription_status = EXCLUDED.subscription_status,
      current_period_end = EXCLUDED.current_period_end,
      trial_end = EXCLUDED.trial_end,
      updated_at = EXCLUDED.updated_at
RETURNING *;
"""


def create_pro_subscription(db_url: str, user_id: str, days: int = 30) -> dict:
    """Upsert a pro subscription for `user_id` and return the row.

    This function is safe for local/dev databases only. It generates test
    Stripe identifiers and sets a timeboxed pro window (now -> now+days).
    """
    if not db_url:
        raise ValueError("DATABASE URL is required")

    now = datetime.utcnow()
    current_period_end = now + timedelta(days=days)

    stripe_customer_id = f"cus_test_{uuid.uuid4().hex[:16]}"
    stripe_subscription_id = f"sub_test_{uuid.uuid4().hex[:16]}"

    created_at = now.isoformat()
    updated_at = now.isoformat()

    params = (
        user_id,
        stripe_subscription_id,
        stripe_customer_id,
        'pro',
        'active',
        current_period_end.isoformat(),
        None,
        created_at,
        updated_at,
    )

    conn = psycopg2.connect(db_url)
    try:
        with conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(INSERT_OR_UPDATE_SQL, params)
                row = cur.fetchone()
                return dict(row) if row else {}
    finally:
        conn.close()


def main(argv: Optional[list[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="Create/update a pro subscription for a user (dev only)")
    parser.add_argument('--user-id', required=True, help='Supabase user UUID to grant pro access')
    parser.add_argument('--days', type=int, default=30, help='Number of days for pro access')
    parser.add_argument('--db-url', default=os.environ.get('DATABASE_URL'), help='Postgres DATABASE_URL')

    args = parser.parse_args(argv)

    if not args.db_url:
        print('Error: DATABASE_URL not provided via --db-url or $DATABASE_URL')
        return 2

    try:
        row = create_pro_subscription(args.db_url, args.user_id, days=args.days)
        print('Success. Upserted subscription:')
        for k, v in row.items():
            print(f'  {k}: {v}')
        return 0
    except Exception as e:
        print('Error creating subscription:', e)
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
