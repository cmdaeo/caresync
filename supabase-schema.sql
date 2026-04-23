-- ============================================================
-- CareSync — Supabase PostgreSQL Schema
-- Run this in the Supabase SQL Editor to create all tables.
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ──────────────────────────────────────────────
-- ENUM types (PostgreSQL requires explicit creation)
-- ──────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('patient', 'caregiver', 'healthcare_provider', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE adherence_status AS ENUM ('taken', 'missed', 'skipped');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_priority AS ENUM ('low', 'medium', 'high');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE consent_type AS ENUM (
    'symptom_processing',
    'medication_tracking',
    'doctor_sharing',
    'caregiver_sharing',
    'analytics',
    'push_notifications',
    'email_notifications'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE consent_action AS ENUM ('grant', 'revoke');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE access_level AS ENUM ('read_only', 'full_access');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired', 'revoked');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ──────────────────────────────────────────────
-- Users table (PII)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  "firstName" VARCHAR(255) NOT NULL,
  "lastName" VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'patient',
  phone VARCHAR(255),
  "dateOfBirth" DATE,
  "profilePicture" VARCHAR(255),
  "isActive" BOOLEAN DEFAULT true,
  "isEmailVerified" BOOLEAN DEFAULT false,
  "emailVerificationToken" VARCHAR(255),
  "passwordResetToken" VARCHAR(255),
  "passwordResetExpires" TIMESTAMP WITH TIME ZONE,
  "lastLogin" TIMESTAMP WITH TIME ZONE,
  "tokenVersion" INTEGER DEFAULT 0,
  "refreshTokenHash" VARCHAR(255),
  preferences JSONB DEFAULT '{"language":"en","notifications":{"email":true,"push":true,"sms":false},"accessibility":{"highContrast":false,"largeText":false,"voiceAlerts":true}}'::jsonb,
  "emergencyContact" JSONB DEFAULT '{"name":"","phone":"","relationship":""}'::jsonb,
  "isTwoFactorEnabled" BOOLEAN DEFAULT false,
  "twoFactorSecret" VARCHAR(255),
  "recoveryCodes" JSONB,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- Medications table (Medical)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS medications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  dosage DECIMAL(10, 2) NOT NULL,
  "dosageUnit" VARCHAR(255) NOT NULL,
  frequency VARCHAR(255) NOT NULL,
  "timesPerDay" INTEGER NOT NULL DEFAULT 1,
  route VARCHAR(255),
  instructions TEXT,
  "startDate" TIMESTAMP WITH TIME ZONE NOT NULL,
  "endDate" TIMESTAMP WITH TIME ZONE,
  "isPRN" BOOLEAN NOT NULL DEFAULT false,
  "remainingQuantity" INTEGER,
  "totalQuantity" INTEGER,
  compartment INTEGER,
  "refillReminder" BOOLEAN DEFAULT true,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- Prescriptions table (Medical)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL,
  "medicationId" UUID REFERENCES medications(id) ON DELETE CASCADE,
  "prescribedBy" VARCHAR(255),
  "prescribedDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "startDate" TIMESTAMP WITH TIME ZONE NOT NULL,
  "endDate" TIMESTAMP WITH TIME ZONE,
  dosage VARCHAR(255) NOT NULL,
  frequency VARCHAR(255) NOT NULL,
  instructions TEXT,
  "refillsRemaining" INTEGER DEFAULT 0,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- Adherence table (Medical)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS adherence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL,
  "medicationId" UUID REFERENCES medications(id) ON DELETE CASCADE,
  "scheduledTime" TIMESTAMP WITH TIME ZONE NOT NULL,
  "takenAt" TIMESTAMP WITH TIME ZONE,
  status adherence_status NOT NULL DEFAULT 'taken',
  notes TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Composite unique index: one adherence record per user+medication+scheduledTime
CREATE UNIQUE INDEX IF NOT EXISTS adherence_user_med_time_uniq
  ON adherence ("userId", "medicationId", "scheduledTime");

-- ──────────────────────────────────────────────
-- Devices table (Medical)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL,
  "deviceId" VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  "deviceType" VARCHAR(255) NOT NULL,
  model VARCHAR(255),
  "serialNumber" VARCHAR(255),
  "firmwareVersion" VARCHAR(255),
  "batteryLevel" INTEGER,
  "connectionStatus" VARCHAR(255),
  "lastSync" TIMESTAMP WITH TIME ZONE,
  "devicePublicKey" TEXT,
  "registrationSignature" TEXT,
  "registrationDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "isActive" BOOLEAN DEFAULT true,
  status JSONB,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- Device Access Permissions table (Medical)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS device_access_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "deviceId" UUID NOT NULL REFERENCES devices(id),
  "userId" UUID NOT NULL,
  "accessLevel" access_level NOT NULL DEFAULT 'read_only',
  "grantedBy" UUID NOT NULL,
  "grantedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "expiresAt" TIMESTAMP WITH TIME ZONE,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE("deviceId", "userId")
);

-- ──────────────────────────────────────────────
-- Device Invitations table (Medical)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS device_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "deviceId" UUID NOT NULL REFERENCES devices(id),
  email VARCHAR(255) NOT NULL,
  "accessLevel" access_level NOT NULL DEFAULT 'read_only',
  "invitationToken" VARCHAR(255) NOT NULL UNIQUE,
  "createdBy" UUID NOT NULL,
  "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "acceptedAt" TIMESTAMP WITH TIME ZONE,
  "acceptedBy" UUID,
  status invitation_status NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- Notifications table (PII)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  priority notification_priority DEFAULT 'medium',
  "isRead" BOOLEAN DEFAULT false,
  "readAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- Caregiver-Patient relationships (PII)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS caregiver_patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "caregiverId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "patientId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  relationship VARCHAR(255),
  "isVerified" BOOLEAN NOT NULL,
  permissions JSONB DEFAULT '{"canViewMedications":true,"canViewAdherence":true,"canManageMedications":false,"canReceiveAlerts":true}'::jsonb,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE("caregiverId", "patientId")
);

-- ──────────────────────────────────────────────
-- Audit Logs (PII)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID REFERENCES users(id),
  action VARCHAR(255) NOT NULL,
  "entityType" VARCHAR(255) NOT NULL,
  "entityId" UUID,
  "oldValues" JSONB,
  "newValues" JSONB,
  "ipAddress" VARCHAR(255),
  "userAgent" VARCHAR(255),
  metadata JSONB,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- Consent Logs (PII) — append-only, no updatedAt
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS consent_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "consentType" consent_type NOT NULL,
  action consent_action NOT NULL,
  "ipAddress" VARCHAR(255),
  "userAgent" VARCHAR(255),
  metadata JSONB,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- Document Metadata (Medical)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS document_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "documentId" UUID NOT NULL UNIQUE,
  "userId" UUID NOT NULL,
  "documentType" VARCHAR(255) NOT NULL,
  "documentHash" VARCHAR(255) NOT NULL,
  "fileName" VARCHAR(255) NOT NULL,
  "fileSize" INTEGER NOT NULL,
  "generationTimestamp" TIMESTAMP WITH TIME ZONE NOT NULL,
  "expirationDate" TIMESTAMP WITH TIME ZONE,
  "passwordProtected" BOOLEAN DEFAULT false,
  "signatureRequired" BOOLEAN DEFAULT false,
  "includeCharts" BOOLEAN DEFAULT false,
  metadata JSONB,
  "accessCount" INTEGER DEFAULT 0,
  "lastAccessed" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- Performance indexes
-- ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_medications_user_id ON medications("userId");
CREATE INDEX IF NOT EXISTS idx_adherence_medication_id ON adherence("medicationId");
CREATE INDEX IF NOT EXISTS idx_adherence_user_id ON adherence("userId");
CREATE INDEX IF NOT EXISTS idx_adherence_scheduled_time ON adherence("scheduledTime");
CREATE INDEX IF NOT EXISTS idx_prescriptions_user_id ON prescriptions("userId");
CREATE INDEX IF NOT EXISTS idx_prescriptions_medication_id ON prescriptions("medicationId");
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices("userId");
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications("userId");
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs("userId");
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs("createdAt");
CREATE INDEX IF NOT EXISTS idx_consent_logs_user_id ON consent_logs("userId");
CREATE INDEX IF NOT EXISTS idx_document_metadata_user_id ON document_metadata("userId");

-- ============================================================
-- Done! All 12 tables created.
-- ============================================================