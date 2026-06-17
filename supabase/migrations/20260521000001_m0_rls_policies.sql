-- M0: RLS 정책 설정
-- 5개 테이블에 Row Level Security 활성화 및 정책 적용

-- ========== events ==========
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_select_public" ON events
  FOR SELECT TO public USING (true);

CREATE POLICY "events_insert_host" ON events
  FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY "events_update_host_or_admin" ON events
  FOR UPDATE USING (
    auth.uid() = host_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "events_delete_host_or_admin" ON events
  FOR DELETE USING (
    auth.uid() = host_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ========== participants ==========
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- host 또는 본인(회원/비회원) 조회 가능
CREATE POLICY "participants_select_host_or_self" ON participants
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM events WHERE id = event_id AND host_id = auth.uid())
    OR user_id = auth.uid()
    OR guest_token = (current_setting('request.cookies', true)::jsonb ->> 'guest_token')
  );

-- 비회원 포함 누구나 신청 가능
CREATE POLICY "participants_insert_public" ON participants
  FOR INSERT TO public WITH CHECK (true);

-- 본인(회원/비회원) 또는 host 수정 가능
CREATE POLICY "participants_update_self_or_host" ON participants
  FOR UPDATE USING (
    user_id = auth.uid()
    OR guest_token = (current_setting('request.cookies', true)::jsonb ->> 'guest_token')
    OR EXISTS (SELECT 1 FROM events WHERE id = event_id AND host_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- host 또는 admin만 삭제
CREATE POLICY "participants_delete_host_or_admin" ON participants
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM events WHERE id = event_id AND host_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ========== notices ==========
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notices_select_public" ON notices
  FOR SELECT TO public USING (true);

CREATE POLICY "notices_insert_author" ON notices
  FOR INSERT WITH CHECK (
    author_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "notices_update_author_or_admin" ON notices
  FOR UPDATE USING (
    author_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "notices_delete_author_or_admin" ON notices
  FOR DELETE USING (
    author_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ========== settlements ==========
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settlements_select_public" ON settlements
  FOR SELECT TO public USING (true);

CREATE POLICY "settlements_insert_host_or_admin" ON settlements
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM events WHERE id = event_id AND host_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "settlements_update_host_or_admin" ON settlements
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM events WHERE id = event_id AND host_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ========== settlement_payments ==========
ALTER TABLE settlement_payments ENABLE ROW LEVEL SECURITY;

-- host 또는 본인 participant 조회 가능
CREATE POLICY "settlement_payments_select_host_or_self" ON settlement_payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM settlements s
      JOIN events e ON e.id = s.event_id
      WHERE s.id = settlement_id AND e.host_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM participants p
      WHERE p.id = participant_id
        AND (
          p.user_id = auth.uid()
          OR p.guest_token = (current_setting('request.cookies', true)::jsonb ->> 'guest_token')
        )
    )
  );

-- 본인(reported 신고) 또는 host(confirmed 확인) 업데이트
CREATE POLICY "settlement_payments_update_self_or_host" ON settlement_payments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM participants p
      WHERE p.id = participant_id
        AND (
          p.user_id = auth.uid()
          OR p.guest_token = (current_setting('request.cookies', true)::jsonb ->> 'guest_token')
        )
    )
    OR EXISTS (
      SELECT 1 FROM settlements s
      JOIN events e ON e.id = s.event_id
      WHERE s.id = settlement_id AND e.host_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
