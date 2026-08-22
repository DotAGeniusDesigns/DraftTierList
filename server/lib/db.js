// Neon serverless Postgres client, plus a one-time schema bootstrap.
//
// Serverless functions are short-lived and can start cold at any time, so
// `ensureSchema()` runs idempotent DDL before a warm instance's first query.

const { neon } = require('@neondatabase/serverless');

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set. Add your Neon connection string to the environment.');
}

const sql = neon(process.env.DATABASE_URL);

let schemaPromise = null;

const createSchema = async () => {
    await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;

    await sql`
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            username TEXT NOT NULL,
            username_lower TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL,
            email_lower TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
            temp_password_hash TEXT,
            temp_password_expires_at TIMESTAMPTZ,
            pending_email TEXT,
            pending_email_lower TEXT,
            email_change_token_hash TEXT,
            email_change_expires_at TIMESTAMPTZ,
            previous_email TEXT,
            previous_email_lower TEXT,
            email_recovery_token_hash TEXT,
            email_recovery_expires_at TIMESTAMPTZ,
            token_version INTEGER NOT NULL DEFAULT 1,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            last_login_at TIMESTAMPTZ
        )
    `;

    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS temp_password_hash TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS temp_password_expires_at TIMESTAMPTZ`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS pending_email TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS pending_email_lower TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_change_token_hash TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_change_expires_at TIMESTAMPTZ`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS previous_email TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS previous_email_lower TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_recovery_token_hash TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_recovery_expires_at TIMESTAMPTZ`;
    await sql`
        CREATE UNIQUE INDEX IF NOT EXISTS users_email_change_token_idx
        ON users(email_change_token_hash)
        WHERE email_change_token_hash IS NOT NULL
    `;
    await sql`
        CREATE UNIQUE INDEX IF NOT EXISTS users_email_recovery_token_idx
        ON users(email_recovery_token_hash)
        WHERE email_recovery_token_hash IS NOT NULL
    `;
    await sql`
        UPDATE users
        SET pending_email = NULL,
            pending_email_lower = NULL,
            email_change_token_hash = NULL,
            email_change_expires_at = NULL
        WHERE email_change_expires_at <= NOW()
    `;
    await sql`
        UPDATE users
        SET previous_email = NULL,
            previous_email_lower = NULL,
            email_recovery_token_hash = NULL,
            email_recovery_expires_at = NULL
        WHERE email_recovery_expires_at <= NOW()
    `;

    await sql`
        CREATE TABLE IF NOT EXISTS boards (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            code TEXT NOT NULL,
            player_count INTEGER NOT NULL DEFAULT 0,
            slot SMALLINT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `;

    await sql`ALTER TABLE boards ADD COLUMN IF NOT EXISTS slot SMALLINT`;
    await sql`
        WITH ranked AS (
            SELECT id, ROW_NUMBER() OVER (
                PARTITION BY user_id ORDER BY created_at, id
            ) AS slot
            FROM boards
            WHERE slot IS NULL
        )
        UPDATE boards
        SET slot = ranked.slot
        FROM ranked
        WHERE boards.id = ranked.id
    `;
    await sql`
        CREATE UNIQUE INDEX IF NOT EXISTS boards_user_slot_idx
        ON boards(user_id, slot)
        WHERE slot IS NOT NULL
    `;
    await sql`CREATE INDEX IF NOT EXISTS boards_user_id_idx ON boards(user_id, updated_at DESC)`;

    // A shareable page a user builds by hand: a name/description plus up to 16
    // managers (league_hub_managers below), each with their own manually
    // entered roster. sleeper_league_id is kept nullable for a live-sync
    // integration later — nothing currently sets it.
    await sql`
        CREATE TABLE IF NOT EXISTS league_hubs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            sleeper_league_id TEXT,
            name TEXT NOT NULL,
            description TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `;
    await sql`ALTER TABLE league_hubs ALTER COLUMN sleeper_league_id DROP NOT NULL`;
    await sql`ALTER TABLE league_hubs ADD COLUMN IF NOT EXISTS description TEXT`;
    await sql`CREATE INDEX IF NOT EXISTS league_hubs_user_id_idx ON league_hubs(user_id, updated_at DESC)`;

    // `roster` is a JSONB array of this app's own player ids (chosen through
    // the same search used on the draft board), not anything from an external
    // platform — there's no live sync yet, so a manager's roster is exactly
    // what the hub owner entered.
    await sql`
        CREATE TABLE IF NOT EXISTS league_hub_managers (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            hub_id UUID NOT NULL REFERENCES league_hubs(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            description TEXT,
            image_data TEXT,
            roster JSONB NOT NULL DEFAULT '[]'::jsonb,
            position SMALLINT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `;
    await sql`
        CREATE UNIQUE INDEX IF NOT EXISTS league_hub_managers_hub_position_idx
        ON league_hub_managers(hub_id, position)
    `;
    await sql`CREATE INDEX IF NOT EXISTS league_hub_managers_hub_id_idx ON league_hub_managers(hub_id, position)`;

    await sql`
        CREATE TABLE IF NOT EXISTS rate_limits (
            bucket TEXT NOT NULL,
            key TEXT NOT NULL,
            attempts INTEGER NOT NULL DEFAULT 0,
            window_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            PRIMARY KEY (bucket, key)
        )
    `;
};

const ensureSchema = () => {
    if (!schemaPromise) {
        schemaPromise = createSchema().catch((error) => {
            schemaPromise = null;
            throw error;
        });
    }
    return schemaPromise;
};

module.exports = { sql, ensureSchema };
