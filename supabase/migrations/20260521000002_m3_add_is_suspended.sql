-- profiles 테이블에 계정 정지 컬럼 추가
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_suspended boolean DEFAULT false;
