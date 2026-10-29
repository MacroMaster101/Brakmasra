-- The "has a password" flag moves from user_metadata (members can write it) to
-- app_metadata (server only), so a session holder can't clear it to skip the
-- current-password check. Carries flags already set by members across once.
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('password_set', true)
WHERE raw_user_meta_data ->> 'password_set' = 'true'
  AND COALESCE(raw_app_meta_data ->> 'password_set', '') <> 'true';
