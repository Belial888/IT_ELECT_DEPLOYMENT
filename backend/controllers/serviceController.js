const db = require("../data/db");
const logAudit = require("../utils/auditLog");

exports.getServices = (req, res) => {
  db.all("SELECT * FROM services ORDER BY service_id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ message: "Failed to fetch services" });
    res.json(rows);
  });
};

exports.createService = (req, res) => {
  const { service_name, description, provider, eligibility, category } = req.body;

  if (!service_name || !description || !provider || !eligibility) {
    return res.status(400).json({ message: "Please complete all required service fields" });
  }

  db.run(
    "INSERT INTO services (service_name, description, provider, eligibility, category) VALUES (?, ?, ?, ?, ?)",
    [service_name, description, provider, eligibility, category || "General"],
    function (err) {
      if (err) return res.status(500).json({ message: "Failed to create service" });
      logAudit(req.user.id, "CREATE_SERVICE", "services", this.lastID, `Created service ${service_name}`);
      res.status(201).json({ message: "Service created", service_id: this.lastID });
    }
  );
};

exports.updateService = (req, res) => {
  const { service_name, description, provider, eligibility, category } = req.body;

  if (!service_name || !description || !provider || !eligibility) {
    return res.status(400).json({ message: "Please complete all required service fields" });
  }

  db.run(
    "UPDATE services SET service_name = ?, description = ?, provider = ?, eligibility = ?, category = ? WHERE service_id = ?",
    [service_name, description, provider, eligibility, category, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ message: "Failed to update service" });
      if (this.changes === 0) return res.status(404).json({ message: "Service not found" });
      logAudit(req.user.id, "UPDATE_SERVICE", "services", req.params.id, `Updated service #${req.params.id}`);
      res.json({ message: "Service updated" });
    }
  );
};

exports.deleteService = (req, res) => {
  const serviceId = req.params.id;
  db.serialize(() => {
    db.run("DELETE FROM vouchers WHERE service_id = ?", [serviceId]);
    db.run("DELETE FROM requirements WHERE app_id IN (SELECT app_id FROM applications WHERE service_id = ?)", [serviceId]);
    db.run("DELETE FROM application_documents WHERE app_id IN (SELECT app_id FROM applications WHERE service_id = ?)", [serviceId]);
    db.run("DELETE FROM applications WHERE service_id = ?", [serviceId]);
    db.run("UPDATE support_requests SET service_id = NULL WHERE service_id = ?", [serviceId]);
    db.run("DELETE FROM services WHERE service_id = ?", [serviceId], function (err) {
      if (err) return res.status(500).json({ message: "Failed to delete service" });
      if (this.changes === 0) return res.status(404).json({ message: "Service not found" });
      logAudit(req.user.id, "DELETE_SERVICE", "services", serviceId, `Deleted service #${serviceId}`);
      res.json({ message: "Service deleted" });
    });
  });
};
