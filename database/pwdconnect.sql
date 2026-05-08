CREATE TABLE users (
  user_id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  disability_type TEXT NOT NULL,
  contact_info TEXT NOT NULL,
  address TEXT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'user'
);

CREATE TABLE admins (
  admin_id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'admin'
);

CREATE TABLE services (
  service_id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_name TEXT NOT NULL,
  description TEXT NOT NULL,
  provider TEXT NOT NULL,
  eligibility TEXT NOT NULL,
  category TEXT DEFAULT 'General'
);

CREATE TABLE applications (
  app_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  service_id INTEGER NOT NULL,
  admin_id INTEGER,
  status TEXT DEFAULT 'Pending Approval',
  date_applied TEXT DEFAULT CURRENT_TIMESTAMP,
  voucher_code TEXT,
  qr_code_url TEXT,
  assistance_confirmation TEXT,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (service_id) REFERENCES services(service_id),
  FOREIGN KEY (admin_id) REFERENCES admins(admin_id)
);

CREATE TABLE announcements (
  announcement_id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  date_posted TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES admins(admin_id)
);

CREATE TABLE support_requests (
  request_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  service_id INTEGER,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'Pending',
  date_submitted TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (service_id) REFERENCES services(service_id)
);

CREATE TABLE application_documents (
  doc_id INTEGER PRIMARY KEY AUTOINCREMENT,
  app_id INTEGER NOT NULL,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  field_name TEXT NOT NULL,
  status TEXT DEFAULT 'Pending',
  uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (app_id) REFERENCES applications(app_id),
  FOREIGN KEY (app_id) REFERENCES applications(app_id)
);
