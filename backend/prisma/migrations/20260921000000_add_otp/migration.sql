CREATE TYPE "OtpPurpose" AS ENUM ('REGISTER', 'LOGIN');
CREATE TYPE "OtpChannel" AS ENUM ('EMAIL', 'SMS');

CREATE TABLE "OtpChallenge" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT,
    "name" TEXT,
    "role" "UserRole" NOT NULL,
    "purpose" "OtpPurpose" NOT NULL,
    "codeHashEmail" TEXT,
    "codeHashSms" TEXT,
    "emailVerifiedAt" TIMESTAMP(3),
    "smsVerifiedAt" TIMESTAMP(3),
    "emailExpiresAt" TIMESTAMP(3),
    "smsExpiresAt" TIMESTAMP(3),
    "emailLastSentAt" TIMESTAMP(3),
    "smsLastSentAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OtpChallenge_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OtpChallenge_email_idx" ON "OtpChallenge"("email");
CREATE INDEX "OtpChallenge_purpose_idx" ON "OtpChallenge"("purpose");
CREATE INDEX "OtpChallenge_createdAt_idx" ON "OtpChallenge"("createdAt");
