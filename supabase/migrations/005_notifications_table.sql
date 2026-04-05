-- Create notifications table for in-app notifications
CREATE TABLE notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'in_app' NOT NULL, -- 'in_app', 'email', 'whatsapp'
    is_read BOOLEAN DEFAULT false NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Add trigger for updated_at
CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON notifications
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for notifications
-- Note: Using simple policies since we use NextAuth (not Supabase Auth)
-- Admin client (service role) bypasses RLS, so all operations work via API
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Allow all operations (RLS bypassed by service role key used in API)
CREATE POLICY "Allow all access to notifications" ON notifications
    FOR ALL USING (true);