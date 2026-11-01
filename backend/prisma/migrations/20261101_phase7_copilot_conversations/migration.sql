-- CreateTable
CREATE TABLE "copilot_conversations" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "eventId" UUID,
    "title" TEXT NOT NULL DEFAULT 'Planning Session',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "copilot_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "copilot_messages" (
    "id" UUID NOT NULL,
    "conversationId" UUID NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "actionPreview" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "copilot_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "copilot_conversations_userId_idx" ON "copilot_conversations"("userId");

-- CreateIndex
CREATE INDEX "copilot_conversations_eventId_idx" ON "copilot_conversations"("eventId");

-- CreateIndex
CREATE INDEX "copilot_messages_conversationId_idx" ON "copilot_messages"("conversationId");

-- CreateIndex
CREATE INDEX "copilot_messages_createdAt_idx" ON "copilot_messages"("createdAt");

-- AddForeignKey
ALTER TABLE "copilot_conversations" ADD CONSTRAINT "copilot_conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "copilot_conversations" ADD CONSTRAINT "copilot_conversations_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "copilot_messages" ADD CONSTRAINT "copilot_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "copilot_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

