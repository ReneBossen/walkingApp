-- Migration: Add max_members to groups
-- Description: Adds a max_members column to the groups table with a CHECK constraint
-- Author: Database Engineer Agent
-- Date: 2026-01-27

ALTER TABLE groups
    ADD COLUMN max_members INTEGER NOT NULL DEFAULT 5
    CONSTRAINT chk_groups_max_members CHECK (max_members >= 1 AND max_members <= 50);
