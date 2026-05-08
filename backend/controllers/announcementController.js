const db = require("../data/db");

exports.getAnnouncements = (req, res) => {
  db.all(
    `SELECT an.*, ad.name AS admin_name
     FROM announcements an
     LEFT JOIN admins ad ON an.admin_id = ad.admin_id
     ORDER BY an.date_posted DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Failed to fetch announcements" });
      res.json(rows);
    }
  );
};

exports.createAnnouncement = (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: "Title and content are required" });
  }

  db.run(
    "INSERT INTO announcements (admin_id, title, content) VALUES (?, ?, ?)",
    [req.user.id, title, content],
    function (err) {
      if (err) return res.status(500).json({ message: "Failed to create announcement" });
      res.status(201).json({ message: "Announcement posted", announcement_id: this.lastID });
    }
  );
};

exports.updateAnnouncement = (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: "Title and content are required" });
  }

  db.run(
    "UPDATE announcements SET title = ?, content = ? WHERE announcement_id = ?",
    [title, content, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ message: "Failed to update announcement" });
      if (this.changes === 0) return res.status(404).json({ message: "Announcement not found" });
      res.json({ message: "Announcement updated" });
    }
  );
};

exports.deleteAnnouncement = (req, res) => {
  db.run("DELETE FROM announcements WHERE announcement_id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ message: "Failed to delete announcement" });
    if (this.changes === 0) return res.status(404).json({ message: "Announcement not found" });
    res.json({ message: "Announcement deleted" });
  });
};
