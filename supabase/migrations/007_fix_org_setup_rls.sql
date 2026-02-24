-- ============================================================================
-- 007_fix_org_setup_rls.sql
-- Fix: setup wizard fails with "new row violates row-level security policy
-- for table 'organizations'" because:
--   1. INSERT organizations + .select() triggers org_select which needs
--      org_members membership — but the user isn't a member yet.
--   2. INSERT org_members bootstrap check works only AFTER the org row exists
--      and the org INSERT has already committed.
--
-- Solution: SECURITY DEFINER function that atomically creates the org and
-- adds the calling user as the first owner member, returning the org id.
-- ============================================================================

-- Atomic org + first member creation (bypasses RLS)
CREATE OR REPLACE FUNCTION public.create_org_with_owner(
  org_name TEXT,
  org_slug TEXT,
  org_plan TEXT DEFAULT 'free',
  org_trial_ends_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- Insert organization
  INSERT INTO organizations (name, slug, plan, trial_ends_at)
  VALUES (org_name, org_slug, org_plan, org_trial_ends_at)
  RETURNING id INTO new_org_id;

  -- Add calling user as owner
  INSERT INTO org_members (org_id, user_id, role)
  VALUES (new_org_id, auth.uid(), 'owner');

  RETURN new_org_id;
END;
$$;
