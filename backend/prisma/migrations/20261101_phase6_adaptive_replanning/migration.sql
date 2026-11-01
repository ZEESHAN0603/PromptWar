-- CreateTable
CREATE TABLE "event_replan_proposals" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'READY_FOR_REVIEW',
    "proposedChanges" JSONB NOT NULL,
    "impactReport" JSONB NOT NULL,
    "aiRecommendations" JSONB,
    "baseEventUpdatedAt" TIMESTAMP(3) NOT NULL,
    "appliedChanges" JSONB,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "appliedAt" TIMESTAMP(3),

    CONSTRAINT "event_replan_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_plan_versions" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "changeSummary" JSONB NOT NULL,
    "sourceProposalId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_plan_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_replan_proposals_eventId_idx" ON "event_replan_proposals"("eventId");

-- CreateIndex
CREATE INDEX "event_replan_proposals_userId_idx" ON "event_replan_proposals"("userId");

-- CreateIndex
CREATE INDEX "event_replan_proposals_status_idx" ON "event_replan_proposals"("status");

-- CreateIndex
CREATE INDEX "event_plan_versions_eventId_idx" ON "event_plan_versions"("eventId");

-- CreateIndex
CREATE INDEX "event_plan_versions_userId_idx" ON "event_plan_versions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "event_plan_versions_eventId_versionNumber_key" ON "event_plan_versions"("eventId", "versionNumber");

-- AddForeignKey
ALTER TABLE "event_replan_proposals" ADD CONSTRAINT "event_replan_proposals_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_replan_proposals" ADD CONSTRAINT "event_replan_proposals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_plan_versions" ADD CONSTRAINT "event_plan_versions_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_plan_versions" ADD CONSTRAINT "event_plan_versions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_plan_versions" ADD CONSTRAINT "event_plan_versions_sourceProposalId_fkey" FOREIGN KEY ("sourceProposalId") REFERENCES "event_replan_proposals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

