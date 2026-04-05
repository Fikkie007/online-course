-- Function to increment total_students counter
CREATE OR REPLACE FUNCTION increment_total_students(course_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE courses
  SET total_students = total_students + 1
  WHERE id = course_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;