CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

INSERT INTO categories (name)
VALUES ('general'), ('food'), ('transport'), ('utilities'), ('entertainment'), ('other')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  spent_on DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE expenses ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES categories(id);

-- Migrate any pre-existing free-text `category` column into category_id,
-- preserving each row's existing value instead of defaulting it away.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'category'
  ) THEN
    INSERT INTO categories (name)
    SELECT DISTINCT category FROM expenses WHERE category IS NOT NULL
    ON CONFLICT (name) DO NOTHING;

    UPDATE expenses e
    SET category_id = c.id
    FROM categories c
    WHERE e.category_id IS NULL AND c.name = e.category;

    ALTER TABLE expenses DROP COLUMN category;
  END IF;
END $$;

UPDATE expenses SET category_id = (SELECT id FROM categories WHERE name = 'general')
  WHERE category_id IS NULL;
ALTER TABLE expenses ALTER COLUMN category_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON expenses(category_id);
