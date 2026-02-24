-- ============================================================================
-- 008_team_invitations.sql
-- Team invitation system for Team plan subscribers (max 5 members).
-- NOTE: Run this SQL in the Supabase dashboard SQL Editor.
-- ============================================================================

-- ============================================================================
-- 1. team_invitations table
-- ============================================================================
CREATE TABLE team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES profiles(id),
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'operator' CHECK (role IN ('operator','manager','viewer')),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','expired','revoked')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, email, status)
);

-- ============================================================================
-- 2. Indexes
-- ============================================================================
CREATE INDEX idx_team_invitations_org_id ON team_invitations(org_id);
CREATE INDEX idx_team_invitations_token ON team_invitations(token);
CREATE INDEX idx_team_invitations_email ON team_invitations(email);

-- ============================================================================
-- 3. RLS
-- ============================================================================
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY invitations_select ON team_invitations FOR SELECT
  USING (org_id IN (SELECT public.get_my_org_ids()));

CREATE POLICY invitations_insert ON team_invitations FOR INSERT
  WITH CHECK (org_id IN (SELECT public.get_my_manageable_org_ids()));

CREATE POLICY invitations_update ON team_invitations FOR UPDATE
  USING (org_id IN (SELECT public.get_my_manageable_org_ids()));

CREATE POLICY invitations_delete ON team_invitations FOR DELETE
  USING (org_id IN (SELECT public.get_my_manageable_org_ids()));

-- ============================================================================
-- 4. SECURITY DEFINER function: accept_team_invitation
-- Invited users don't have org_members INSERT permission, so we need
-- a SECURITY DEFINER function to bypass RLS.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.accept_team_invitation(invitation_token TEXT)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv RECORD;
  member_count INT;
BEGIN
  -- Find the invitation
  SELECT * INTO inv FROM team_invitations
  WHERE token = invitation_token AND status = 'pending' AND expires_at > now();

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Invalid or expired invitation');
  END IF;

  -- Check member count (max 5)
  SELECT COUNT(*) INTO member_count FROM org_members WHERE org_id = inv.org_id;
  IF member_count >= 5 THEN
    RETURN json_build_object('error', 'Team member limit reached (max 5)');
  END IF;

  -- Check if already a member
  IF EXISTS (SELECT 1 FROM org_members WHERE org_id = inv.org_id AND user_id = auth.uid()) THEN
    UPDATE team_invitations SET status = 'accepted' WHERE id = inv.id;
    RETURN json_build_object('error', 'Already a member of this organization');
  END IF;

  -- Add to org_members
  INSERT INTO org_members (org_id, user_id, role)
  VALUES (inv.org_id, auth.uid(), inv.role);

  -- Mark invitation as accepted
  UPDATE team_invitations SET status = 'accepted' WHERE id = inv.id;

  RETURN json_build_object('success', true, 'org_id', inv.org_id);
END;
$$;
