/*
# Add sarcasm_score column to chat_messages

1. Modified Tables
- `chat_messages`
  - New column: `sarcasm_score` (integer, nullable, default null)
  - Stores the sarcasm score (0-100) returned by the Gemini API for each Dante response.
  - Only applies to assistant messages; user messages will have NULL.

2. Security
- No changes to RLS policies. The column is writable via existing INSERT/UPDATE policies.
- No new tables created.

3. Important Notes
- The column is nullable so existing rows are not affected.
- The edge function will populate this column for new assistant messages.
- Admin statistics will read from this column.
*/

ALTER TABLE chat_messages
ADD COLUMN IF NOT EXISTS sarcasm_score integer;
