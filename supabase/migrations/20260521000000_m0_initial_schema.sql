-- M0: 초기 스키마 마이그레이션
-- profiles 테이블 컬럼 추가 및 신규 테이블 생성

-- profiles 테이블에 role, display_name 컬럼 추가
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'host' CHECK (role IN ('host', 'admin'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name text;
UPDATE profiles SET role = 'host' WHERE role IS NULL;

-- events 테이블 생성
CREATE TABLE IF NOT EXISTS events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  location text,
  event_date timestamptz,
  max_participants integer,
  status text DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled')),
  invite_token uuid DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- participants 테이블 생성
CREATE TABLE IF NOT EXISTS participants (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_token text,
  name text NOT NULL,
  contact text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now()
);

-- notices 테이블 생성
CREATE TABLE IF NOT EXISTS notices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  author_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  title text NOT NULL,
  content text NOT NULL,
  is_pinned boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- settlements 테이블 생성
CREATE TABLE IF NOT EXISTS settlements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid UNIQUE REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  total_amount integer NOT NULL,
  per_person_amount integer,
  bank_name text,
  account_number text,
  account_holder text,
  status text DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at timestamptz DEFAULT now()
);

-- settlement_payments 테이블 생성
CREATE TABLE IF NOT EXISTS settlement_payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  settlement_id uuid REFERENCES settlements(id) ON DELETE CASCADE NOT NULL,
  participant_id uuid REFERENCES participants(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'reported', 'confirmed')),
  reported_at timestamptz,
  confirmed_at timestamptz
);
