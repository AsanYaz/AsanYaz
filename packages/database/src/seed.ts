import { pool } from './index';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

const SEED_SQL = `
-- ============================================
-- SEED: Admin User
-- ============================================
INSERT INTO users (id, email, password_hash, first_name, last_name, role, email_verified, is_active)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'admin@asanyaz.com',
  crypt('admin123', gen_salt('bf')),
  'Admin',
  'AsanYaz',
  'super_admin',
  TRUE,
  TRUE
) ON CONFLICT (email) DO NOTHING;

-- ============================================
-- SEED: Universities
-- ============================================
INSERT INTO universities (id, name, short_name, is_active) VALUES
  ('u0000000-0000-0000-0000-000000000001', 'Azərbaycan Memarlıq və İnşaat Universiteti', 'AzMİU', TRUE),
  ('u0000000-0000-0000-0000-000000000002', 'Bakı Dövlət Universiteti', 'BDU', TRUE),
  ('u0000000-0000-0000-0000-000000000003', 'Azərbaycan Dövlət İqtisad Universiteti', 'UNEC', TRUE),
  ('u0000000-0000-0000-0000-000000000004', 'Azərbaycan Dövlət Neft və Sənaye Universiteti', 'ADNSU', TRUE),
  ('u0000000-0000-0000-0000-000000000005', 'ADA Universiteti', 'ADA', TRUE)
ON CONFLICT DO NOTHING;

-- ============================================
-- SEED: Sample Faculties
-- ============================================
INSERT INTO faculties (id, university_id, name, is_active) VALUES
  ('f0000000-0000-0000-0000-000000000001', 'u0000000-0000-0000-0000-000000000002', 'Fizika fakültəsi', TRUE),
  ('f0000000-0000-0000-0000-000000000002', 'u0000000-0000-0000-0000-000000000002', 'Riyaziyyat və informatika fakültəsi', TRUE),
  ('f0000000-0000-0000-0000-000000000003', 'u0000000-0000-0000-0000-000000000002', 'İqtisadiyyat fakültəsi', TRUE),
  ('f0000000-0000-0000-0000-000000000004', 'u0000000-0000-0000-0000-000000000003', 'İqtisadiyyat fakültəsi', TRUE),
  ('f0000000-0000-0000-0000-000000000005', 'u0000000-0000-0000-0000-000000000003', 'Biznes idarəetmə fakültəsi', TRUE),
  ('f0000000-0000-0000-0000-000000000006', 'u0000000-0000-0000-0000-000000000001', 'Memarlıq fakültəsi', TRUE),
  ('f0000000-0000-0000-0000-000000000007', 'u0000000-0000-0000-0000-000000000001', 'İnşaat fakültəsi', TRUE),
  ('f0000000-0000-0000-0000-000000000008', 'u0000000-0000-0000-0000-000000000004', 'Neft-mədən fakültəsi', TRUE),
  ('f0000000-0000-0000-0000-000000000009', 'u0000000-0000-0000-0000-000000000004', 'İnformasiya texnologiyaları fakültəsi', TRUE),
  ('f0000000-0000-0000-0000-000000000010', 'u0000000-0000-0000-0000-000000000005', 'School of IT and Engineering', TRUE)
ON CONFLICT DO NOTHING;

-- ============================================
-- SEED: Services
-- ============================================
INSERT INTO services (id, name, description, price, is_active, required_fields, supported_output_formats, estimated_processing_minutes, sort_order) VALUES
  (
    's0000000-0000-0000-0000-000000000001',
    'Sərbəst iş',
    'Verilmiş mövzu üzrə sərbəst iş hazırlanması. Müəyyən edilmiş strukturda, universitet tələblərinə uyğun.',
    2.00,
    TRUE,
    '[{"name":"topic","label":"Mövzu","type":"text","required":true},{"name":"length","label":"Səhifə sayı","type":"number","required":false,"placeholder":"5-10"}]'::jsonb,
    '["pdf","docx"]'::jsonb,
    10,
    1
  ),
  (
    's0000000-0000-0000-0000-000000000002',
    'Sərbəst iş + təqdimat',
    'Sərbəst iş və ona uyğun təqdimat (PowerPoint) hazırlanması.',
    5.00,
    TRUE,
    '[{"name":"topic","label":"Mövzu","type":"text","required":true},{"name":"length","label":"Səhifə sayı","type":"number","required":false,"placeholder":"5-10"},{"name":"slides","label":"Slayd sayı","type":"number","required":false,"placeholder":"8-12"}]'::jsonb,
    '["pdf","docx","pptx"]'::jsonb,
    15,
    2
  ),
  (
    's0000000-0000-0000-0000-000000000003',
    'Uzun təqdimat',
    'Ətraflı təqdimat (PowerPoint) hazırlanması. Müfəssəl məzmun, vizual dizayn.',
    10.00,
    TRUE,
    '[{"name":"topic","label":"Mövzu","type":"text","required":true},{"name":"slides","label":"Slayd sayı","type":"number","required":false,"placeholder":"20-30"}]'::jsonb,
    '["pptx","pdf"]'::jsonb,
    20,
    3
  ),
  (
    's0000000-0000-0000-0000-000000000004',
    'Kurs işi',
    'Tam kurs işi hazırlanması. Giriş, nəzəri hissə, praktiki hissə, nəticə, ədəbiyyat siyahısı.',
    20.00,
    TRUE,
    '[{"name":"topic","label":"Mövzu","type":"text","required":true},{"name":"length","label":"Səhifə sayı","type":"number","required":false,"placeholder":"25-35"},{"name":"instructor","label":"Elmi rəhbər","type":"text","required":false}]'::jsonb,
    '["pdf","docx"]'::jsonb,
    30,
    4
  ),
  (
    's0000000-0000-0000-0000-000000000005',
    'Laboratoriya işi',
    'Laboratoriya işi hesabatının hazırlanması. Nəzəri hissə, eksperiment, nəticələr.',
    20.00,
    TRUE,
    '[{"name":"topic","label":"Mövzu","type":"text","required":true},{"name":"subject","label":"Fənn","type":"text","required":true},{"name":"labNumber","label":"Laboratoriya nömrəsi","type":"text","required":false}]'::jsonb,
    '["pdf","docx"]'::jsonb,
    20,
    5
  ),
  (
    's0000000-0000-0000-0000-000000000006',
    'Diplom işi',
    'Tam diplom işi hazırlanması. Bütün tələb olunan bölmələr, ədəbiyyat icmalı, tədqiqat.',
    150.00,
    TRUE,
    '[{"name":"topic","label":"Mövzu","type":"text","required":true},{"name":"length","label":"Səhifə sayı","type":"number","required":false,"placeholder":"50-70"},{"name":"instructor","label":"Elmi rəhbər","type":"text","required":true}]'::jsonb,
    '["pdf","docx"]'::jsonb,
    120,
    6
  ),
  (
    's0000000-0000-0000-0000-000000000007',
    'Magistr dissertasiyası',
    'Magistr dissertasiyası hazırlanması. Elmi tədqiqat, analiz, nəticələr.',
    200.00,
    TRUE,
    '[{"name":"topic","label":"Mövzu","type":"text","required":true},{"name":"length","label":"Səhifə sayı","type":"number","required":false,"placeholder":"80-100"},{"name":"instructor","label":"Elmi rəhbər","type":"text","required":true}]'::jsonb,
    '["pdf","docx"]'::jsonb,
    180,
    7
  ),
  (
    's0000000-0000-0000-0000-000000000008',
    'Doktorantura işi',
    'Doktorantura dissertasiyası hazırlanması. Dərin elmi tədqiqat və analiz.',
    300.00,
    TRUE,
    '[{"name":"topic","label":"Mövzu","type":"text","required":true},{"name":"length","label":"Səhifə sayı","type":"number","required":false,"placeholder":"120-150"},{"name":"instructor","label":"Elmi rəhbər","type":"text","required":true}]'::jsonb,
    '["pdf","docx"]'::jsonb,
    360,
    8
  )
ON CONFLICT DO NOTHING;

-- ============================================
-- SEED: Default Templates (unverified samples)
-- ============================================
INSERT INTO templates (id, name, university_id, service_id, language, is_active, is_verified) VALUES
  ('t0000000-0000-0000-0000-000000000001', 'BDU - Ümumi şablon', 'u0000000-0000-0000-0000-000000000002', NULL, 'az', TRUE, FALSE),
  ('t0000000-0000-0000-0000-000000000002', 'UNEC - Ümumi şablon', 'u0000000-0000-0000-0000-000000000003', NULL, 'az', TRUE, FALSE),
  ('t0000000-0000-0000-0000-000000000003', 'AzMİU - Ümumi şablon', 'u0000000-0000-0000-0000-000000000001', NULL, 'az', TRUE, FALSE),
  ('t0000000-0000-0000-0000-000000000004', 'ADNSU - Ümumi şablon', 'u0000000-0000-0000-0000-000000000004', NULL, 'az', TRUE, FALSE),
  ('t0000000-0000-0000-0000-000000000005', 'ADA - Ümumi şablon', 'u0000000-0000-0000-0000-000000000005', NULL, 'az', TRUE, FALSE)
ON CONFLICT DO NOTHING;

-- ============================================
-- SEED: Default Template Versions with sample analysis
-- ============================================
INSERT INTO template_versions (id, template_id, version, is_active, analysis) VALUES
  ('tv000000-0000-0000-0000-000000000001', 't0000000-0000-0000-0000-000000000001', 1, TRUE, '{
    "formatting": {
      "font": "Times New Roman",
      "fontSize": 14,
      "lineSpacing": 1.5,
      "margins": {"top": 2, "bottom": 2, "left": 3, "right": 1.5},
      "paragraphSpacing": {"before": 0, "after": 6}
    },
    "structure": {
      "coverPage": true,
      "abstract": false,
      "tableOfContents": true,
      "introduction": true,
      "chapters": true,
      "conclusion": true,
      "references": true,
      "appendices": false
    },
    "headings": [
      {"level": 1, "font": "Times New Roman", "fontSize": 16, "bold": true, "alignment": "center"},
      {"level": 2, "font": "Times New Roman", "fontSize": 14, "bold": true, "alignment": "left"}
    ]
  }'::jsonb),
  ('tv000000-0000-0000-0000-000000000002', 't0000000-0000-0000-0000-000000000002', 1, TRUE, '{
    "formatting": {
      "font": "Times New Roman",
      "fontSize": 14,
      "lineSpacing": 1.5,
      "margins": {"top": 2, "bottom": 2, "left": 3, "right": 1.5}
    },
    "structure": {
      "coverPage": true,
      "tableOfContents": true,
      "introduction": true,
      "chapters": true,
      "conclusion": true,
      "references": true
    }
  }'::jsonb),
  ('tv000000-0000-0000-0000-000000000003', 't0000000-0000-0000-0000-000000000003', 1, TRUE, '{
    "formatting": {
      "font": "Times New Roman",
      "fontSize": 14,
      "lineSpacing": 1.5,
      "margins": {"top": 2, "bottom": 2, "left": 3, "right": 1}
    },
    "structure": {
      "coverPage": true,
      "tableOfContents": true,
      "introduction": true,
      "chapters": true,
      "conclusion": true,
      "references": true
    }
  }'::jsonb),
  ('tv000000-0000-0000-0000-000000000004', 't0000000-0000-0000-0000-000000000004', 1, TRUE, '{
    "formatting": {
      "font": "Times New Roman",
      "fontSize": 14,
      "lineSpacing": 1.5,
      "margins": {"top": 2, "bottom": 2, "left": 3, "right": 1.5}
    },
    "structure": {
      "coverPage": true,
      "tableOfContents": true,
      "introduction": true,
      "chapters": true,
      "conclusion": true,
      "references": true
    }
  }'::jsonb),
  ('tv000000-0000-0000-0000-000000000005', 't0000000-0000-0000-0000-000000000005', 1, TRUE, '{
    "formatting": {
      "font": "Times New Roman",
      "fontSize": 12,
      "lineSpacing": 1.5,
      "margins": {"top": 2.54, "bottom": 2.54, "left": 2.54, "right": 2.54}
    },
    "structure": {
      "coverPage": true,
      "abstract": true,
      "tableOfContents": true,
      "introduction": true,
      "chapters": true,
      "conclusion": true,
      "references": true,
      "appendices": true
    }
  }'::jsonb)
ON CONFLICT DO NOTHING;
`;

async function seed() {
  console.log('🌱 Seeding AsanYaz database...');
  
  try {
    await pool.query(SEED_SQL);
    console.log('✅ Database seeded successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
