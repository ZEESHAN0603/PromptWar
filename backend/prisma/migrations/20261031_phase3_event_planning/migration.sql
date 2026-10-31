-- EventPilot AI: Phase 3 Migration Script
-- Target: Supabase PostgreSQL
-- Models: budget_categories, expenses, guests, tasks, task_dependencies, timeline_items
-- Safety: Non-destructive, idempotent DDL (No DROP/TRUNCATE)

-- 1. Ensure public schema exists
CREATE SCHEMA IF NOT EXISTS "public";

-- 2. Create budget_categories table
CREATE TABLE IF NOT EXISTS "public"."budget_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "eventId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "allocatedAmount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "description" TEXT,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "budget_categories_pkey" PRIMARY KEY ("id")
);

-- 3. Create expenses table
CREATE TABLE IF NOT EXISTS "public"."expenses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "eventId" UUID NOT NULL,
    "categoryId" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "estimatedAmount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "actualAmount" DECIMAL(12,2),
    "expenseDate" TIMESTAMP(3),
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- 4. Create guests table
CREATE TABLE IF NOT EXISTS "public"."guests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "eventId" UUID NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "phoneNumber" TEXT,
    "guestCategory" TEXT,
    "rsvpStatus" TEXT NOT NULL DEFAULT 'pending',
    "plusOneAllowed" BOOLEAN NOT NULL DEFAULT false,
    "plusOneCount" INTEGER NOT NULL DEFAULT 0,
    "dietaryPreference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guests_pkey" PRIMARY KEY ("id")
);

-- 5. Create tasks table
CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "eventId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3),
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'todo',
    "assignedTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- 6. Create task_dependencies table
CREATE TABLE IF NOT EXISTS "public"."task_dependencies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "taskId" UUID NOT NULL,
    "dependsOnTaskId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_dependencies_pkey" PRIMARY KEY ("id")
);

-- 7. Create timeline_items table
CREATE TABLE IF NOT EXISTS "public"."timeline_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "eventId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "location" TEXT,
    "category" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "timeline_items_pkey" PRIMARY KEY ("id")
);

-- 8. Create Indexes
CREATE INDEX IF NOT EXISTS "budget_categories_eventId_idx" ON "public"."budget_categories"("eventId");
CREATE UNIQUE INDEX IF NOT EXISTS "budget_categories_eventId_name_key" ON "public"."budget_categories"("eventId", "name");

CREATE INDEX IF NOT EXISTS "expenses_eventId_idx" ON "public"."expenses"("eventId");
CREATE INDEX IF NOT EXISTS "expenses_categoryId_idx" ON "public"."expenses"("categoryId");
CREATE INDEX IF NOT EXISTS "expenses_paymentStatus_idx" ON "public"."expenses"("paymentStatus");

CREATE INDEX IF NOT EXISTS "guests_eventId_idx" ON "public"."guests"("eventId");
CREATE INDEX IF NOT EXISTS "guests_rsvpStatus_idx" ON "public"."guests"("rsvpStatus");

CREATE INDEX IF NOT EXISTS "tasks_eventId_idx" ON "public"."tasks"("eventId");
CREATE INDEX IF NOT EXISTS "tasks_status_idx" ON "public"."tasks"("status");
CREATE INDEX IF NOT EXISTS "tasks_priority_idx" ON "public"."tasks"("priority");
CREATE INDEX IF NOT EXISTS "tasks_dueDate_idx" ON "public"."tasks"("dueDate");

CREATE INDEX IF NOT EXISTS "task_dependencies_taskId_idx" ON "public"."task_dependencies"("taskId");
CREATE INDEX IF NOT EXISTS "task_dependencies_dependsOnTaskId_idx" ON "public"."task_dependencies"("dependsOnTaskId");
CREATE UNIQUE INDEX IF NOT EXISTS "task_dependencies_taskId_dependsOnTaskId_key" ON "public"."task_dependencies"("taskId", "dependsOnTaskId");

CREATE INDEX IF NOT EXISTS "timeline_items_eventId_idx" ON "public"."timeline_items"("eventId");
CREATE INDEX IF NOT EXISTS "timeline_items_startTime_idx" ON "public"."timeline_items"("startTime");

-- 9. Foreign Keys
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'budget_categories_eventId_fkey'
    ) THEN
        ALTER TABLE "public"."budget_categories"
        ADD CONSTRAINT "budget_categories_eventId_fkey"
        FOREIGN KEY ("eventId")
        REFERENCES "public"."events"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'expenses_eventId_fkey'
    ) THEN
        ALTER TABLE "public"."expenses"
        ADD CONSTRAINT "expenses_eventId_fkey"
        FOREIGN KEY ("eventId")
        REFERENCES "public"."events"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'expenses_categoryId_fkey'
    ) THEN
        ALTER TABLE "public"."expenses"
        ADD CONSTRAINT "expenses_categoryId_fkey"
        FOREIGN KEY ("categoryId")
        REFERENCES "public"."budget_categories"("id")
        ON DELETE SET NULL
        ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'guests_eventId_fkey'
    ) THEN
        ALTER TABLE "public"."guests"
        ADD CONSTRAINT "guests_eventId_fkey"
        FOREIGN KEY ("eventId")
        REFERENCES "public"."events"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'tasks_eventId_fkey'
    ) THEN
        ALTER TABLE "public"."tasks"
        ADD CONSTRAINT "tasks_eventId_fkey"
        FOREIGN KEY ("eventId")
        REFERENCES "public"."events"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'task_dependencies_taskId_fkey'
    ) THEN
        ALTER TABLE "public"."task_dependencies"
        ADD CONSTRAINT "task_dependencies_taskId_fkey"
        FOREIGN KEY ("taskId")
        REFERENCES "public"."tasks"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'task_dependencies_dependsOnTaskId_fkey'
    ) THEN
        ALTER TABLE "public"."task_dependencies"
        ADD CONSTRAINT "task_dependencies_dependsOnTaskId_fkey"
        FOREIGN KEY ("dependsOnTaskId")
        REFERENCES "public"."tasks"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'timeline_items_eventId_fkey'
    ) THEN
        ALTER TABLE "public"."timeline_items"
        ADD CONSTRAINT "timeline_items_eventId_fkey"
        FOREIGN KEY ("eventId")
        REFERENCES "public"."events"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE;
    END IF;
END $$;

