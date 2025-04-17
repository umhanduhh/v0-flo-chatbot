-- Add metadata column to chat_sessions if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'chat_sessions' 
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE chat_sessions ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Create index for language queries
CREATE INDEX IF NOT EXISTS idx_chat_sessions_language ON chat_sessions ((metadata->>'language'));

-- Add language to analytics queries
ALTER TABLE question_analytics ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en';
CREATE INDEX IF NOT EXISTS idx_question_analytics_language ON question_analytics(language);
