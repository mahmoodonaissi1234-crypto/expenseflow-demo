CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  spent_on DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE expenses ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES categories(id);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

-- Drop the old global unique-name constraint before backfilling per-user rows below,
-- since two different users legitimately sharing a category name (e.g. both had
-- "food") would otherwise collide against the still-active global constraint.
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_name_key;

DO $$
BEGIN
  -- Upgrade path A: pre-existing free-text `category` column on expenses.
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'category'
  ) THEN
    INSERT INTO categories (user_id, name)
    SELECT DISTINCT user_id, category FROM expenses WHERE category IS NOT NULL;

    UPDATE expenses e
    SET category_id = c.id
    FROM categories c
    WHERE e.category_id IS NULL AND c.user_id = e.user_id AND c.name = e.category;

    ALTER TABLE expenses DROP COLUMN category;
  END IF;

  -- Upgrade path B: pre-existing global (unowned) categories table.
  IF EXISTS (SELECT 1 FROM categories WHERE user_id IS NULL) THEN
    INSERT INTO categories (user_id, name)
    SELECT DISTINCT e.user_id, c.name
    FROM expenses e
    JOIN categories c ON c.id = e.category_id
    WHERE c.user_id IS NULL;

    UPDATE expenses e
    SET category_id = pc.id
    FROM categories c, categories pc
    WHERE e.category_id = c.id
      AND c.user_id IS NULL
      AND pc.user_id = e.user_id
      AND pc.name = c.name;

    DELETE FROM categories WHERE user_id IS NULL;
  END IF;
END $$;

-- Give every existing user a starter set of categories if they have none yet
-- (new users get these at registration time instead; see auth.controller.js).
INSERT INTO categories (user_id, name)
SELECT u.id, d.name
FROM users u
CROSS JOIN (
  VALUES ('general'), ('food'), ('transport'), ('utilities'), ('entertainment'), ('other')
) AS d(name)
WHERE NOT EXISTS (SELECT 1 FROM categories c WHERE c.user_id = u.id);

UPDATE expenses e
SET category_id = (
  SELECT id FROM categories WHERE user_id = e.user_id AND name = 'general' LIMIT 1
)
WHERE category_id IS NULL;

ALTER TABLE categories ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE expenses ALTER COLUMN category_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'categories_user_id_name_key'
  ) THEN
    ALTER TABLE categories ADD CONSTRAINT categories_user_id_name_key UNIQUE (user_id, name);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
