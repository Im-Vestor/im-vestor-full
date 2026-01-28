-- CreateIndex for ProjectView table
CREATE INDEX "ProjectView_projectId_idx" ON "ProjectView"("projectId");
CREATE INDEX "ProjectView_investorId_idx" ON "ProjectView"("investorId");
CREATE INDEX "ProjectView_vcGroupId_idx" ON "ProjectView"("vcGroupId");
CREATE INDEX "ProjectView_createdAt_idx" ON "ProjectView"("createdAt");

-- CreateIndex for Negotiation table
CREATE INDEX "Negotiation_investorId_idx" ON "Negotiation"("investorId");
CREATE INDEX "Negotiation_projectId_idx" ON "Negotiation"("projectId");
CREATE INDEX "Negotiation_vcGroupId_idx" ON "Negotiation"("vcGroupId");
CREATE INDEX "Negotiation_stage_idx" ON "Negotiation"("stage");

-- CreateIndex for Referral table
CREATE INDEX "Referral_referrerId_idx" ON "Referral"("referrerId");
CREATE INDEX "Referral_referredId_idx" ON "Referral"("referredId");

-- CreateIndex for Connection table
CREATE INDEX "Connection_followerId_idx" ON "Connection"("followerId");
CREATE INDEX "Connection_followingId_idx" ON "Connection"("followingId");

-- CreateIndex for Notification table
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX "Notification_type_idx" ON "Notification"("type");
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex for Meeting table
CREATE INDEX "Meeting_entrepreneurId_idx" ON "Meeting"("entrepreneurId");
CREATE INDEX "Meeting_negotiationId_idx" ON "Meeting"("negotiationId");
CREATE INDEX "Meeting_startDate_idx" ON "Meeting"("startDate");

-- CreateIndex for Project table
CREATE INDEX "Project_sectorId_idx" ON "Project"("sectorId");
CREATE INDEX "Project_visibility_status_boostedUntil_createdAt_idx" ON "Project"("visibility", "status", "boostedUntil", "createdAt");
