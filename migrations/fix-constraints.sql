-- Add unique constraint to url column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'help_articles' 
        AND constraint_type = 'UNIQUE' 
        AND constraint_name = 'help_articles_url_key'
    ) THEN
        ALTER TABLE help_articles ADD CONSTRAINT help_articles_url_key UNIQUE (url);
    END IF;
END $$;

-- Add unique constraint to article_id and chunk_index if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'embeddings' 
        AND constraint_type = 'UNIQUE' 
        AND constraint_name = 'embeddings_article_chunk_key'
    ) THEN
        ALTER TABLE embeddings ADD CONSTRAINT embeddings_article_chunk_key UNIQUE (article_id, chunk_index);
    END IF;
END $$;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'embeddings' 
        AND constraint_type = 'FOREIGN KEY' 
        AND constraint_name = 'embeddings_article_id_fkey'
    ) THEN
        ALTER TABLE embeddings 
        ADD CONSTRAINT embeddings_article_id_fkey 
        FOREIGN KEY (article_id) REFERENCES help_articles(id) ON DELETE CASCADE;
    END IF;
END $$;
