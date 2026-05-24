insert into authors (id, full_name, email, phone, instagram_handle, dashboard_user_id, locale, metadata)
values
  ('3e2b5344-0a38-4a0b-a656-4d09f89a1001', 'Sara Johnson', 'sara.johnson@gmail.com', '+919812345001', '@sarapoetry23', 'dash_sara_001', 'en-IN', '{"segment":"debut_author","city":"Bengaluru"}'),
  ('3e2b5344-0a38-4a0b-a656-4d09f89a1002', 'Arjun Mehta', 'arjun.mehta@outlook.com', '+919812345002', '@arjunwrites', 'dash_arjun_002', 'en-IN', '{"segment":"premium_pr","city":"Mumbai"}'),
  ('3e2b5344-0a38-4a0b-a656-4d09f89a1003', 'Nisha Kapoor', 'nisha.kapoor@gmail.com', '+919812345003', '@nishapoems', 'dash_nisha_003', 'en-IN', '{"segment":"returning_author","city":"Delhi"}')
on conflict (id) do nothing;

insert into author_identities (author_id, type, value, normalized_value, confidence, verified, source)
values
  ('3e2b5344-0a38-4a0b-a656-4d09f89a1001', 'EMAIL', 'sara.johnson@gmail.com', 'sara.johnson@gmail.com', 1, true, 'EMAIL'),
  ('3e2b5344-0a38-4a0b-a656-4d09f89a1001', 'INSTAGRAM', '@sarapoetry23', 'sarapoetry23', 1, true, 'INSTAGRAM'),
  ('3e2b5344-0a38-4a0b-a656-4d09f89a1002', 'PHONE', '+919812345002', '919812345002', 1, true, 'WHATSAPP'),
  ('3e2b5344-0a38-4a0b-a656-4d09f89a1003', 'EMAIL', 'nisha.kapoor@gmail.com', 'nisha.kapoor@gmail.com', 1, true, 'EMAIL')
on conflict do nothing;

insert into books (
  id,
  author_id,
  title,
  status,
  isbn,
  royalty_status,
  royalty_amount_due,
  royalty_payout_date,
  add_on_services,
  final_submission_date,
  book_live_date,
  author_copy_status,
  author_copy_tracking,
  pr_package_status,
  dashboard_status,
  sales_report_url
)
values
  (
    '9b8369d6-16d5-40d7-a5fd-7dc17f350001',
    '3e2b5344-0a38-4a0b-a656-4d09f89a1001',
    'Dreams of Fire',
    'LIVE',
    '978-93-5891-421-7',
    'PROCESSING',
    7420.50,
    '2026-05-31T00:00:00+05:30',
    '{"editing":"COMPLETED","cover_design":"COMPLETED","pr_package":"IN_PROGRESS"}',
    '2026-03-05T00:00:00+05:30',
    '2026-04-19T00:00:00+05:30',
    'DISPATCHED',
    'BL-DTDC-782911',
    'IN_PROGRESS',
    'ACTIVE',
    'https://bookleaf.example/reports/dreams-of-fire'
  ),
  (
    '9b8369d6-16d5-40d7-a5fd-7dc17f350002',
    '3e2b5344-0a38-4a0b-a656-4d09f89a1002',
    'The Monsoon Letters',
    'PROOF_REVIEW',
    null,
    'NOT_DUE',
    0,
    null,
    '{"editing":"COMPLETED","cover_design":"REVISION_REQUESTED","pr_package":"NOT_STARTED"}',
    '2026-04-28T00:00:00+05:30',
    null,
    'NOT_DISPATCHED',
    null,
    'NOT_STARTED',
    'ACTIVE',
    null
  ),
  (
    '9b8369d6-16d5-40d7-a5fd-7dc17f350003',
    '3e2b5344-0a38-4a0b-a656-4d09f89a1003',
    'Paper Boats at Dawn',
    'ISBN_ASSIGNED',
    '978-93-5891-555-9',
    'PAID',
    0,
    '2026-04-30T00:00:00+05:30',
    '{"editing":"COMPLETED","cover_design":"COMPLETED","author_copies":"QUEUED"}',
    '2026-04-01T00:00:00+05:30',
    null,
    'QUEUED',
    null,
    'SCHEDULED',
    'PASSWORD_RESET_REQUIRED',
    null
  )
on conflict (id) do nothing;
