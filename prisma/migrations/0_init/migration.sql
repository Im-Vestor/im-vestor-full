-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('EUR', 'USD', 'BRL');

-- CreateEnum
CREATE TYPE "HyperTrainItemType" AS ENUM ('PROJECT', 'INVESTOR', 'NEWS');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ProjectVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('ENTREPRENEUR', 'INVESTOR', 'PARTNER', 'VC_GROUP', 'INCUBATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING_EMAIL_VERIFICATION');

-- CreateEnum
CREATE TYPE "PreferredHoursPeriod" AS ENUM ('MORNING', 'AFTERNOON', 'EVENING');

-- CreateEnum
CREATE TYPE "ProjectStage" AS ENUM ('PRE_SEED', 'SEED', 'SERIES_A', 'SERIES_B', 'SERIES_C', 'IPO', 'SOCIAL_IMPACT');

-- CreateEnum
CREATE TYPE "NegotiationStage" AS ENUM ('PITCH', 'NEGOTIATION', 'DETAILS', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('PROJECT_VIEW', 'MEETING_CREATED', 'MEETING_CANCELLED', 'NEGOTIATION_CREATED', 'NEGOTIATION_CANCELLED', 'NEGOTIATION_GO_TO_NEXT_STAGE', 'POKE', 'SUPPORT_TICKET_REPLY', 'SUPPORT_TICKET_STATUS_UPDATED', 'SUPPORT_TICKET_CREATED', 'SUPPORT_TICKET_RECEIVED');

-- CreateTable
CREATE TABLE "Country" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "numericCode" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "State" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "countryId" INTEGER NOT NULL,

    CONSTRAINT "State_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Area" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referrerId" TEXT NOT NULL,
    "referredId" TEXT NOT NULL,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "imageUrl" TEXT,
    "referralCode" TEXT NOT NULL,
    "userType" "UserType" NOT NULL,
    "availablePokes" INTEGER NOT NULL DEFAULT 0,
    "stripeCustomerId" TEXT,
    "availableBoosts" INTEGER NOT NULL DEFAULT 0,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VcGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bio" TEXT,
    "description" TEXT,
    "website" TEXT,
    "email" TEXT NOT NULL,
    "logo" TEXT,
    "phone" TEXT,
    "openingDate" TIMESTAMP(3),
    "managedCapital" DOUBLE PRECISION,
    "averageInvestmentSize" DOUBLE PRECISION,
    "brochureUrl" TEXT,
    "investmentPolicy" TEXT,
    "stages" "ProjectStage"[],
    "linkedinUrl" TEXT,
    "youtubeUrl" TEXT,
    "instagram" TEXT,
    "twitter" TEXT,
    "principalStartups" TEXT,
    "principalExits" TEXT,
    "userId" TEXT NOT NULL,
    "stateId" INTEGER,
    "countryId" INTEGER,

    CONSTRAINT "VcGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VcGroupMember" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "photo" TEXT,
    "role" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "owner" BOOLEAN NOT NULL DEFAULT false,
    "vcGroupId" TEXT NOT NULL,

    CONSTRAINT "VcGroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incubator" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bio" TEXT,
    "description" TEXT,
    "website" TEXT,
    "logo" TEXT,
    "phone" TEXT,
    "email" TEXT NOT NULL,
    "openingDate" TIMESTAMP(3),
    "startupsIncubated" INTEGER,
    "startupsInIncubator" INTEGER,
    "acceptStartupsOutsideRegion" BOOLEAN NOT NULL DEFAULT false,
    "brochureUrl" TEXT,
    "ownerName" TEXT,
    "ownerRole" TEXT,
    "ownerPhone" TEXT,
    "ownerEmail" TEXT,
    "linkedinUrl" TEXT,
    "facebook" TEXT,
    "instagram" TEXT,
    "twitter" TEXT,
    "associatedIncubators" TEXT,
    "associatedUniversities" TEXT,
    "activePrograms" TEXT,
    "userId" TEXT NOT NULL,
    "stateId" INTEGER,
    "countryId" INTEGER,

    CONSTRAINT "Incubator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "companyName" TEXT,
    "mobileFone" TEXT,
    "userId" TEXT NOT NULL,
    "companyLogoUrl" TEXT,
    "photo" TEXT,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Investor" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "mobileFone" TEXT,
    "fiscalCode" TEXT,
    "investmentMinValue" DOUBLE PRECISION NOT NULL,
    "investmentMaxValue" DOUBLE PRECISION NOT NULL,
    "birthDate" TIMESTAMP(3),
    "photo" TEXT,
    "banner" TEXT,
    "about" TEXT,
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "userId" TEXT NOT NULL,
    "stateId" INTEGER,
    "countryId" INTEGER,
    "personalPitchUrl" TEXT,
    "linkedinUrl" TEXT,

    CONSTRAINT "Investor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "negotiationId" TEXT,
    "entrepreneurId" TEXT,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entrepreneur" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "mobileFone" TEXT,
    "companyName" TEXT,
    "companyRole" TEXT,
    "fiscalCode" TEXT,
    "birthDate" TIMESTAMP(3),
    "photo" TEXT,
    "banner" TEXT,
    "about" TEXT,
    "userId" TEXT NOT NULL,
    "stateId" INTEGER,
    "countryId" INTEGER,
    "personalPitchUrl" TEXT,
    "linkedinUrl" TEXT,

    CONSTRAINT "Entrepreneur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreferredHours" (
    "id" TEXT NOT NULL,
    "period" "PreferredHoursPeriod" NOT NULL,
    "time" TEXT NOT NULL,
    "entrepreneurId" TEXT NOT NULL,

    CONSTRAINT "PreferredHours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quickSolution" TEXT,
    "website" TEXT,
    "foundationDate" TIMESTAMP(3),
    "stage" "ProjectStage",
    "about" TEXT,
    "actionPlan" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "startInvestment" DOUBLE PRECISION,
    "investorSlots" INTEGER,
    "annualRevenue" DOUBLE PRECISION,
    "monthsToReturn" INTEGER,
    "equity" DOUBLE PRECISION,
    "investmentGoal" DOUBLE PRECISION NOT NULL,
    "logo" TEXT,
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "photo1" TEXT,
    "photo2" TEXT,
    "photo3" TEXT,
    "photo4" TEXT,
    "videoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "entrepreneurId" TEXT,
    "favoriteInvestorId" TEXT,
    "favoriteVcGroupId" TEXT,
    "investedInvestorId" TEXT,
    "investedVcGroupId" TEXT,
    "sectorId" TEXT NOT NULL,
    "countryId" INTEGER,
    "stateId" INTEGER,
    "incubatorId" TEXT,
    "visibility" "ProjectVisibility" NOT NULL DEFAULT 'PRIVATE',
    "socialImpactBeneficiaries" INTEGER,
    "socialImpactDescription" TEXT,
    "socialImpactMetrics" TEXT,
    "photo1Caption" TEXT,
    "photo2Caption" TEXT,
    "photo3Caption" TEXT,
    "photo4Caption" TEXT,
    "boostedUntil" TIMESTAMP(3),

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncubatorEntrepreneur" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "mobileFone" TEXT,
    "companyRole" TEXT,
    "birthDate" TIMESTAMP(3),
    "photo" TEXT,
    "about" TEXT,
    "linkedinUrl" TEXT,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "IncubatorEntrepreneur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Negotiation" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "stage" "NegotiationStage" NOT NULL DEFAULT 'PITCH',
    "investorActionNeeded" BOOLEAN NOT NULL DEFAULT false,
    "entrepreneurActionNeeded" BOOLEAN NOT NULL DEFAULT false,
    "investorAgreedToGoToNextStage" BOOLEAN NOT NULL DEFAULT false,
    "entrepreneurAgreedToGoToNextStage" BOOLEAN NOT NULL DEFAULT false,
    "investorId" TEXT,
    "projectId" TEXT NOT NULL,
    "vcGroupId" TEXT,

    CONSTRAINT "Negotiation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowYourNumbers" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "KnowYourNumbers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "knowYourNumbersId" TEXT,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectFaq" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "ProjectFaq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectView" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "investorId" TEXT,
    "projectId" TEXT NOT NULL,
    "vcGroupId" TEXT,

    CONSTRAINT "ProjectView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "File" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "projectId" TEXT,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Connection" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,

    CONSTRAINT "Connection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "NotificationType" NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "investorId" TEXT,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "SupportTicketStatus" NOT NULL DEFAULT 'OPEN',
    "userId" TEXT NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicketReply" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "message" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,

    CONSTRAINT "SupportTicketReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestorProjectNote" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "InvestorProjectNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PotentialUser" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "event" TEXT,

    CONSTRAINT "PotentialUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HyperTrainItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "link" TEXT NOT NULL,
    "type" "HyperTrainItemType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "liveUntil" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "externalId" TEXT NOT NULL,

    CONSTRAINT "HyperTrainItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteContent" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "contentHtml" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AreaToIncubator" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_AreaToInvestor" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_AreaToVcGroup" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_IncubatorToOffer" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_MeetingIncubators" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_FavoriteInvestors" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_InvestedInvestors" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_MeetingInvestors" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_MeetingVcGroups" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_FavoriteVcGroups" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_InvestedVcGroups" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- CreateIndex
CREATE UNIQUE INDEX "VcGroup_userId_key" ON "VcGroup"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Incubator_userId_key" ON "Incubator"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Partner_userId_key" ON "Partner"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Investor_userId_key" ON "Investor"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Entrepreneur_userId_key" ON "Entrepreneur"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "KnowYourNumbers_projectId_key" ON "KnowYourNumbers"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Connection_followerId_followingId_key" ON "Connection"("followerId", "followingId");

-- CreateIndex
CREATE UNIQUE INDEX "InvestorProjectNote_investorId_projectId_key" ON "InvestorProjectNote"("investorId", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "HyperTrainItem_externalId_key" ON "HyperTrainItem"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "SiteContent_key_key" ON "SiteContent"("key");

-- CreateIndex
CREATE UNIQUE INDEX "_AreaToIncubator_AB_unique" ON "_AreaToIncubator"("A", "B");

-- CreateIndex
CREATE INDEX "_AreaToIncubator_B_index" ON "_AreaToIncubator"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_AreaToInvestor_AB_unique" ON "_AreaToInvestor"("A", "B");

-- CreateIndex
CREATE INDEX "_AreaToInvestor_B_index" ON "_AreaToInvestor"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_AreaToVcGroup_AB_unique" ON "_AreaToVcGroup"("A", "B");

-- CreateIndex
CREATE INDEX "_AreaToVcGroup_B_index" ON "_AreaToVcGroup"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_IncubatorToOffer_AB_unique" ON "_IncubatorToOffer"("A", "B");

-- CreateIndex
CREATE INDEX "_IncubatorToOffer_B_index" ON "_IncubatorToOffer"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_MeetingIncubators_AB_unique" ON "_MeetingIncubators"("A", "B");

-- CreateIndex
CREATE INDEX "_MeetingIncubators_B_index" ON "_MeetingIncubators"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_FavoriteInvestors_AB_unique" ON "_FavoriteInvestors"("A", "B");

-- CreateIndex
CREATE INDEX "_FavoriteInvestors_B_index" ON "_FavoriteInvestors"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_InvestedInvestors_AB_unique" ON "_InvestedInvestors"("A", "B");

-- CreateIndex
CREATE INDEX "_InvestedInvestors_B_index" ON "_InvestedInvestors"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_MeetingInvestors_AB_unique" ON "_MeetingInvestors"("A", "B");

-- CreateIndex
CREATE INDEX "_MeetingInvestors_B_index" ON "_MeetingInvestors"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_MeetingVcGroups_AB_unique" ON "_MeetingVcGroups"("A", "B");

-- CreateIndex
CREATE INDEX "_MeetingVcGroups_B_index" ON "_MeetingVcGroups"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_FavoriteVcGroups_AB_unique" ON "_FavoriteVcGroups"("A", "B");

-- CreateIndex
CREATE INDEX "_FavoriteVcGroups_B_index" ON "_FavoriteVcGroups"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_InvestedVcGroups_AB_unique" ON "_InvestedVcGroups"("A", "B");

-- CreateIndex
CREATE INDEX "_InvestedVcGroups_B_index" ON "_InvestedVcGroups"("B");

-- AddForeignKey
ALTER TABLE "State" ADD CONSTRAINT "State_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referredId_fkey" FOREIGN KEY ("referredId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VcGroup" ADD CONSTRAINT "VcGroup_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VcGroup" ADD CONSTRAINT "VcGroup_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "State"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VcGroup" ADD CONSTRAINT "VcGroup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VcGroupMember" ADD CONSTRAINT "VcGroupMember_vcGroupId_fkey" FOREIGN KEY ("vcGroupId") REFERENCES "VcGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incubator" ADD CONSTRAINT "Incubator_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incubator" ADD CONSTRAINT "Incubator_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "State"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incubator" ADD CONSTRAINT "Incubator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partner" ADD CONSTRAINT "Partner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investor" ADD CONSTRAINT "Investor_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investor" ADD CONSTRAINT "Investor_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "State"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investor" ADD CONSTRAINT "Investor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_entrepreneurId_fkey" FOREIGN KEY ("entrepreneurId") REFERENCES "Entrepreneur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_negotiationId_fkey" FOREIGN KEY ("negotiationId") REFERENCES "Negotiation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entrepreneur" ADD CONSTRAINT "Entrepreneur_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entrepreneur" ADD CONSTRAINT "Entrepreneur_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "State"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entrepreneur" ADD CONSTRAINT "Entrepreneur_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreferredHours" ADD CONSTRAINT "PreferredHours_entrepreneurId_fkey" FOREIGN KEY ("entrepreneurId") REFERENCES "Entrepreneur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_entrepreneurId_fkey" FOREIGN KEY ("entrepreneurId") REFERENCES "Entrepreneur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_incubatorId_fkey" FOREIGN KEY ("incubatorId") REFERENCES "Incubator"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "State"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncubatorEntrepreneur" ADD CONSTRAINT "IncubatorEntrepreneur_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Negotiation" ADD CONSTRAINT "Negotiation_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "Investor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Negotiation" ADD CONSTRAINT "Negotiation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Negotiation" ADD CONSTRAINT "Negotiation_vcGroupId_fkey" FOREIGN KEY ("vcGroupId") REFERENCES "VcGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowYourNumbers" ADD CONSTRAINT "KnowYourNumbers_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_knowYourNumbersId_fkey" FOREIGN KEY ("knowYourNumbersId") REFERENCES "KnowYourNumbers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectFaq" ADD CONSTRAINT "ProjectFaq_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectView" ADD CONSTRAINT "ProjectView_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "Investor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectView" ADD CONSTRAINT "ProjectView_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectView" ADD CONSTRAINT "ProjectView_vcGroupId_fkey" FOREIGN KEY ("vcGroupId") REFERENCES "VcGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicketReply" ADD CONSTRAINT "SupportTicketReply_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicketReply" ADD CONSTRAINT "SupportTicketReply_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestorProjectNote" ADD CONSTRAINT "InvestorProjectNote_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "Investor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestorProjectNote" ADD CONSTRAINT "InvestorProjectNote_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AreaToIncubator" ADD CONSTRAINT "_AreaToIncubator_A_fkey" FOREIGN KEY ("A") REFERENCES "Area"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AreaToIncubator" ADD CONSTRAINT "_AreaToIncubator_B_fkey" FOREIGN KEY ("B") REFERENCES "Incubator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AreaToInvestor" ADD CONSTRAINT "_AreaToInvestor_A_fkey" FOREIGN KEY ("A") REFERENCES "Area"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AreaToInvestor" ADD CONSTRAINT "_AreaToInvestor_B_fkey" FOREIGN KEY ("B") REFERENCES "Investor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AreaToVcGroup" ADD CONSTRAINT "_AreaToVcGroup_A_fkey" FOREIGN KEY ("A") REFERENCES "Area"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AreaToVcGroup" ADD CONSTRAINT "_AreaToVcGroup_B_fkey" FOREIGN KEY ("B") REFERENCES "VcGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_IncubatorToOffer" ADD CONSTRAINT "_IncubatorToOffer_A_fkey" FOREIGN KEY ("A") REFERENCES "Incubator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_IncubatorToOffer" ADD CONSTRAINT "_IncubatorToOffer_B_fkey" FOREIGN KEY ("B") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MeetingIncubators" ADD CONSTRAINT "_MeetingIncubators_A_fkey" FOREIGN KEY ("A") REFERENCES "Incubator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MeetingIncubators" ADD CONSTRAINT "_MeetingIncubators_B_fkey" FOREIGN KEY ("B") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FavoriteInvestors" ADD CONSTRAINT "_FavoriteInvestors_A_fkey" FOREIGN KEY ("A") REFERENCES "Investor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FavoriteInvestors" ADD CONSTRAINT "_FavoriteInvestors_B_fkey" FOREIGN KEY ("B") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InvestedInvestors" ADD CONSTRAINT "_InvestedInvestors_A_fkey" FOREIGN KEY ("A") REFERENCES "Investor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InvestedInvestors" ADD CONSTRAINT "_InvestedInvestors_B_fkey" FOREIGN KEY ("B") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MeetingInvestors" ADD CONSTRAINT "_MeetingInvestors_A_fkey" FOREIGN KEY ("A") REFERENCES "Investor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MeetingInvestors" ADD CONSTRAINT "_MeetingInvestors_B_fkey" FOREIGN KEY ("B") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MeetingVcGroups" ADD CONSTRAINT "_MeetingVcGroups_A_fkey" FOREIGN KEY ("A") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MeetingVcGroups" ADD CONSTRAINT "_MeetingVcGroups_B_fkey" FOREIGN KEY ("B") REFERENCES "VcGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FavoriteVcGroups" ADD CONSTRAINT "_FavoriteVcGroups_A_fkey" FOREIGN KEY ("A") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FavoriteVcGroups" ADD CONSTRAINT "_FavoriteVcGroups_B_fkey" FOREIGN KEY ("B") REFERENCES "VcGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InvestedVcGroups" ADD CONSTRAINT "_InvestedVcGroups_A_fkey" FOREIGN KEY ("A") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InvestedVcGroups" ADD CONSTRAINT "_InvestedVcGroups_B_fkey" FOREIGN KEY ("B") REFERENCES "VcGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

