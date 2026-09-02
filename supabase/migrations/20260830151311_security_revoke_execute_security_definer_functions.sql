/*
# Security hardening: Revoke EXECUTE on SECURITY DEFINER functions

## Problem
31 SECURITY DEFINER functions are executable by the `anon` role, and
38 by `authenticated`. Several admin functions have no internal auth check:
  - admin_grant_dantes (no auth check at all)
  - admin_read_redemptions (uses auth.uid but no is_admin)
  - award_referral_* (no auth check, callable by anon)
  - generate_referral_code, link_referral (no auth check)
  - reset_daily_*, increment_message_count (should be cron/internal only)
  - seed_admin (one-time setup)
  - get_vault_secret (reads secrets!)

## Fix
1. Revoke EXECUTE from anon on ALL functions in public schema
2. Revoke EXECUTE from authenticated on admin-only and internal functions
3. Grant EXECUTE back to authenticated only on functions they call from the frontend
*/

-- Step 1: Revoke EXECUTE from anon on ALL functions in public schema
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon;

-- Step 2: Revoke EXECUTE from authenticated on internal/trigger/cron/admin functions
-- that are NOT called directly from the frontend
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.update_archived_chapters_updated_at() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.award_referral_credits(p_referred_id uuid, p_credits_used integer) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.award_referral_dantes(p_referred_id uuid, p_dantes_amount integer) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.award_referral_signup(p_referred_id uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.award_referral_subscription(p_referred_id uuid, p_plan text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_affiliate_account() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_message_count(p_uid uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.reset_daily_credits() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.reset_daily_messages(p_uid uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin(check_uid uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.seed_admin() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_referral_code() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.link_referral(p_referred_id uuid, p_referral_code text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_vault_secret(secret_name text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_grant_dantes(target_user uuid, amount integer) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_read_redemptions() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_affiliate_set_custom_rule(p_ambassador_id uuid, p_visit_batch_size integer, p_visit_batch_coins integer, p_signup_coins integer, p_credits_coins_per integer, p_credits_threshold integer, p_dantes_coins_per integer, p_dantes_threshold integer, p_plan_coins_override jsonb) FROM authenticated;

-- Step 3: Grant EXECUTE to authenticated on functions they call from the frontend
GRANT EXECUTE ON FUNCTION public.track_affiliate_visit(p_code text, p_ip_hash text, p_session text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_visit_retention(p_visit_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.become_ambassador() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_affiliate_account() TO authenticated;
GRANT EXECUTE ON FUNCTION public.affiliate_redeem(p_item_id uuid, p_pix_key text, p_pix_key_type text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_game_win(p_game_type text, p_game_id uuid, p_reward integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_card_code(p_code text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_shop_item(p_item_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_task(p_submission_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_task(p_submission_id uuid, p_feedback text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.import_lovable_conversation(p_user_id uuid, p_messages jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_grant_points(p_user_id uuid, p_amount integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_grant_card(p_user_id uuid, p_card_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_plan(p_user_id uuid, p_plan text, p_expires_at timestamp with time zone) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_affiliate_adjust_coins(p_ambassador_id uuid, p_amount integer, p_reason text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_affiliate_block(p_ambassador_id uuid, p_blocked boolean, p_reason text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_affiliate_send_notification(p_ambassador_id uuid, p_type text, p_title text, p_message text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_affiliate_update_redemption(p_redemption_id uuid, p_status text, p_note text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_save_custom_rules(p_ambassador_id uuid, p_visit_batch_size integer, p_visit_batch_coins integer, p_signup_coins integer, p_credits_coins_per integer, p_credits_threshold integer, p_dantes_coins_per integer, p_dantes_threshold integer, p_plan_coins_override jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_attach_referral(p_ambassador_id uuid, p_referred_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_remove_referral(p_referral_id uuid) TO authenticated;
