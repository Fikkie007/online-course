-- Create categories table
CREATE TABLE categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    icon TEXT DEFAULT '📚',
    description TEXT,
    order_index INTEGER DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add category_id to courses
ALTER TABLE courses ADD COLUMN category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- Create index
CREATE INDEX idx_courses_category_id ON courses(category_id);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_order_index ON categories(order_index);

-- Add trigger for updated_at
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories
INSERT INTO categories (name, slug, icon, description, order_index) VALUES
    ('Programming', 'programming', '💻', 'Belajar coding dan pengembangan software', 1),
    ('Design', 'design', '🎨', 'Desain grafis, UI/UX, dan kreatif', 2),
    ('Business', 'business', '📈', 'Bisnis, keuangan, dan entrepreneurship', 3),
    ('Marketing', 'marketing', '📣', 'Digital marketing dan strategi pemasaran', 4),
    ('Data Science', 'data', '📊', 'Data analysis, machine learning, dan AI', 5);