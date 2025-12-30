## � Local Supabase Development Setup (Optional)

The project uses [Supabase](https://supabase.com/) as its backend database and authentication service. While you can use a hosted Supabase account, you also have the option to run Supabase locally for development purposes.

If you prefer to run Supabase locally without using a hosted account, follow these steps (Successfully tested in Linux Mint 22.2 Cinnamon):

### Prerequisites for Local Supabase
- Docker Engine and Docker Compose (required to run local services)
- PostgreSQL (local database)
- Supabase CLI (command-line tool for local development)

### Step 1: Install Docker

**Linux (Ubuntu/Debian):**
```bash
# Update package manager
sudo apt update

# Install Docker and Docker Compose plugin
sudo apt install -y docker.io docker-compose


# Either you can enable Docker to run on startup 
sudo systemctl enable --now docker
# Or run it only before starting the project with
sudo systemctl start docker

# Verify installation
docker --version
docker compose version
docker ps
```

You can close docker using:
```bash
sudo systemctl stop docker
```

**macOS/Windows:** Download [Docker Desktop](https://www.docker.com/products/docker-desktop)

### Step 2: Install Supabase CLI

Install the Supabase CLI globally via npm:
```bash
npm install supabase --save-dev
```

In this (project) repo, initialize the Supabase project:
```bash
npx supabase init
```

### Step 3: Start Local Supabase Stack

Navigate to your project directory and start the local Supabase stack:
```bash
# Start the local Supabase services (Postgres, Auth, Realtime, etc.)
npx supabase start
```

This command will:
- Download necessary Docker images
- Start PostgreSQL database (has to installed before)
- Set up Supabase Auth, Realtime, Storage, and other services
- Print your local credentials in the terminal

### Step 4: Get Your Local Credentials

After running `npx supabase start`, the CLI will display your local credentials like this:

```
Supabase local development server is running.

API URL: http://localhost:54321
GraphQL URL: http://localhost:54321/graphql/v1
DB URL: postgresql://postgres:postgres@localhost:5432/postgres
Studio URL: http://localhost:54323
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Service role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 5: Update Your Environment Variables

Update your `.env.local` file with the local Supabase credentials:

```env
# Use the local API URL (not https://)
NEXT_PUBLIC_SUPABASE_URL="http://..."

# Copy the Anon Key from the CLI output
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-from-cli-output"

# Copy the Service Role Key from the CLI output
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-from-cli-output"
```

### Step 6: Push Database Schema

Initialize your local database with the project schema:

```bash
# Push the schema.sql to your local Supabase instance
supabase db push --db-url=your_supabase_db_url schema.sql
```

This will create all necessary tables and set up Row Level Security (RLS) policies.

### Step 7: Access Supabase Dashboard

You can manage your local database and users through the Supabase Studio dashboard:

```
http://localhost:xxxxx
```

Log in with:
- **Email:** supabase@localhost
- **Password:** (typically no password for local dev, just click login)

### Step 8: Start Development Server

Now you're ready to start developing:

```bash
pnpm dev
```

Visit `http://localhost:3000` and your app will connect to your local Supabase instance.

### Useful Supabase CLI Commands

```bash
# Stop the local Supabase stack
supabase stop

# Reset your local database (warning: deletes all data)
supabase db reset

# View logs from Supabase services
supabase logs

# Push new migrations to local database
supabase db push

# Pull changes from Supabase (if using remote)
supabase db pull
```

### Troubleshooting Local Supabase

- **Docker not running:** Ensure Docker daemon is active (`sudo systemctl start docker` on Linux)
- **Credentials not displayed:** Run `supabase status` to see your connection details
- **Database connection issues:** Verify `DATABASE_URL` matches the CLI output exactly. May need to link/push schema directly via psql:
`psql your_supabase_db_url -f schema.sql`
