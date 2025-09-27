CREATE SEQUENCE user_id_seq CACHE 100;
CREATE TABLE users (
  id BIGINT PRIMARY KEY DEFAULT nextval('user_id_seq'),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE SEQUENCE recipes_id_seq CACHE 100;
CREATE TABLE recipes (
  id BIGINT PRIMARY KEY DEFAULT nextval('recipes_id_seq'),
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE SEQUENCE ingredients_id_seq CACHE 100;
CREATE TABLE ingredients (
  id BIGINT PRIMARY KEY DEFAULT  nextval('ingredients_id_seq'),
  recipe_id BIGINT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  amount TEXT NOT NULL,
  name TEXT NOT NULL
);


CREATE SEQUENCE instructions_id_seq CACHE 100;
CREATE TABLE instructions (
  id BIGINT PRIMARY KEY DEFAULT nextval('instructions_id_seq'),
  recipe_id BIGINT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,

  text TEXT NOT NULL,
  CONSTRAINT uniq_step_per_recipe UNIQUE (recipe_id, step_number)
);

CREATE INDEX idx_recipe_user_id ON recipes(user_id);
CREATE INDEX idx_ingredients_recipe_id ON ingredients(recipe_id);
CREATE INDEX idx_instructions_recipe_id ON instructions(recipe_id);
