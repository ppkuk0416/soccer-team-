-- Migration: 쿼터별 참석 투표
-- Supabase SQL Editor에서 실행하세요

-- 1. events 테이블에 총 쿼터 수 추가 (기본 4쿼터)
ALTER TABLE events ADD COLUMN IF NOT EXISTS total_quarters int NOT NULL DEFAULT 4;

-- 2. attend_votes에 쿼터 선택 배열 추가
--    예: {1,2,3} = 1~3쿼터 참석, {3,4} = 3~4쿼터만 참석
ALTER TABLE attend_votes ADD COLUMN IF NOT EXISTS quarters int[] DEFAULT NULL;
