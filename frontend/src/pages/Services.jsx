import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";
import Icon from "../components/Icon";

export default function Services() {
  const [services, setServices] = useState([]);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const loadServices = async () => {
    const res = await api.get("/services");
    setServices(res.data);
  };

  useEffect(() => {
    loadServices().catch(() => setMessage("Failed to load services"));
  }, []);

  const apply = async (service_id) => {
    setMessage("");
    try {
      await api.post("/applications", { service_id });
      setMessage("Application submitted successfully.");
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to apply");
    }
  };

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(services.map((service) => service.category || "General")))],
    [services]
  );

  const filteredServices = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return services.filter((service) => {
      const matchesCategory = category === "All" || service.category === category;
      const haystack = [
        service.service_name,
        service.provider,
        service.category,
        service.eligibility,
        service.description
      ].join(" ").toLowerCase();
      return matchesCategory && (!keyword || haystack.includes(keyword));
    });
  }, [services, search, category]);

  return (
    <Layout title="Browse Services" subtitle="Explore available services and programs for Persons with Disabilities.">
      {message && <div className="alert">{message}</div>}
      <section className="panel filterPanel">
        <div className="filterRow">
          <label>
            <span>Search services</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, provider, category, or eligibility"
            />
          </label>
          <label>
            <span>Category</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
        </div>
      </section>
      <section className="serviceGrid">
        {filteredServices.length === 0 && <div className="emptyState">No services match your search.</div>}
        {filteredServices.map((service) => (
          <div className="serviceCard" key={service.service_id}>
            <div className="serviceIcon">
              <Icon name="briefcase" size={22} />
            </div>
            <span>{service.category}</span>
            <h3>{service.service_name}</h3>
            <p>{service.description}</p>
            <small><strong>Provider:</strong> {service.provider}</small>
            <small><strong>Eligibility:</strong> {service.eligibility}</small>
            <button className="primaryBtn" onClick={() => apply(service.service_id)}>
              <Icon name="arrowRight" />
              <span>Apply Now</span>
            </button>
          </div>
        ))}
      </section>
    </Layout>
  );
}
