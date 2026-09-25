-- Public bucket for member profile photos. The site also creates it on the
-- first upload, so running this is optional.
-- Anyone may view a photo by its URL. There are no insert, update or delete
-- policies: only the server (service role) writes, after re-encoding each
-- upload to a 512px WebP. The object path is kept in auth app_metadata,
-- which members cannot edit.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', TRUE, 921600, ARRAY['image/webp'])
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;
