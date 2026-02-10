import React from "react";

export default function DashboardCard({ title, children }) {
  return (
    <section className="dashboard-card">
      {title && <h3 className="dashboard-card-title">{title}</h3>}
      {children}
    </section>
  );
}
