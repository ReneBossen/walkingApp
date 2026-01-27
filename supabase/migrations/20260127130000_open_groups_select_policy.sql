-- Migration: Open groups SELECT policy
-- Description: Replaces restrictive SELECT policies on groups table with a single
--              policy allowing any authenticated user to SELECT any group. This
--              enables join-by-code lookups and public group browsing. Sensitive
--              fields like join_code are filtered at the API layer, not via RLS.
-- Author: Database Engineer Agent
-- Date: 2026-01-27

-- ============================================================================
-- DROP EXISTING SELECT POLICIES
-- ============================================================================

-- Drop the public-only policy from migration 006
DROP POLICY IF EXISTS "Anyone can view public groups" ON groups;

-- Drop the members-only policy from migration 017
DROP POLICY IF EXISTS "Members can view their groups" ON groups;

-- ============================================================================
-- NEW SELECT POLICY
-- ============================================================================

-- Any authenticated user can view any group row. This is required because:
-- 1. Non-members need to look up groups by join_code to join them
-- 2. Non-members need to browse/search public groups
-- 3. The join_code field is already protected at the API layer (only
--    owners/admins see it in API responses)
CREATE POLICY "Authenticated users can view any group"
    ON groups FOR SELECT
    TO authenticated
    USING (true);

COMMENT ON POLICY "Authenticated users can view any group" ON groups IS
    'Allows any authenticated user to SELECT any group. Required for join-by-code '
    'lookups and public group browsing. Sensitive fields (join_code) are filtered '
    'at the API layer, not via RLS.';
