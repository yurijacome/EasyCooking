

-- tabela usuarios

CREATE TABLE users (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  email text NOT NULL UNIQUE,
  nome text NOT NULL UNIQUE,
  phone character varying,
  isadmin boolean DEFAULT false,
  senhahash character varying NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);