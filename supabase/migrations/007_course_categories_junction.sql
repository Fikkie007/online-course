-- Create junction table for course-category many-to-many relationship
CREATE TABLE course_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(course_id, category_id)
);

-- Create index for better query performance
CREATE INDEX idx_course_categories_course_id ON course_categories(course_id);
CREATE INDEX idx_course_categories_category_id ON course_categories(category_id);

-- Drop the category_id column from courses (if exists)
ALTER TABLE courses DROP COLUMN IF EXISTS category_id;