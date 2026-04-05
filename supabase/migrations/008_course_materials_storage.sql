-- Create storage bucket for course materials
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'course-materials',
    'course-materials',
    true,
    524288000, -- 500MB limit
    ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/jpeg', 'image/png', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Policy: Allow public read access
CREATE POLICY "Allow public read access" ON storage.objects
    FOR SELECT USING (bucket_id = 'course-materials');

-- Policy: Allow service role to upload (admin client uses service role)
CREATE POLICY "Allow service role to upload" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'course-materials'
        AND auth.jwt() ->> 'role' = 'service_role'
    );

-- Policy: Allow service role to update
CREATE POLICY "Allow service role to update" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'course-materials'
        AND auth.jwt() ->> 'role' = 'service_role'
    );

-- Policy: Allow service role to delete
CREATE POLICY "Allow service role to delete" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'course-materials'
        AND auth.jwt() ->> 'role' = 'service_role'
    );