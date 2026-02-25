import React, { useEffect, useState } from "react";

/*
  Enterprise Audit Explorer
  Pagination • Filters • Search • Export
*/

export default function AuditExplorer() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [actorId, setActorId] = useState("");
  const [action, setAction] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  /* =========================================================
     LOAD DATA
  ========================================================= */

  async function loadAudit(p = page) {
    setLoading(true);

    const params = new URLSearchParams({
      page: p,
      limit: 25,
      search,
      actorId,
      action,
      startDate,
      endDate,
    });

    try {
      const res = await fetch(`/api/admin/audit?${params.toString()}`, {
        credentials: "include",
      });

      const data = await res.json();

      if (data.ok) {
        setEvents(data.events || []);
        setPages(data.pages || 1);
        setTotal(data.total || 0);
        setPage(data.page || 1);
      }
    } catch (e) {
      console.error("Audit load failed", e);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadAudit(1);
  }, []);

  /* =========================================================
     EXPORT JSON
  ========================================================= */

  function exportJSON() {
    const blob = new Blob([JSON.stringify(events, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-page-${page}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ========================================================= */

  return (
    <div className="postureCard">
      <div style={{ marginBottom: 20 }}>
        <h3>Audit Explorer</h3>
        <small className="muted">
          Full administrative activity log
        </small>
      </div>

      {/* FILTER BAR */}
      <div className="filterRow">
        <input
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <input
          placeholder="Actor ID"
          value={actorId}
          onChange={(e) => setActorId(e.target.value)}
        />

        <input
          placeholder="Action"
          value={action}
          onChange={(e) => setAction(e.target.value)}
        />

        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />

        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />

        <button className="btn primary" onClick={() => loadAudit(1)}>
          Apply
        </button>

        <button className="btn ok" onClick={exportJSON}>
          Export
        </button>
      </div>

      {/* RESULTS COUNT */}
      <div style={{ marginTop: 15 }}>
        <small>
          Showing page {page} of {pages} • {total} total events
        </small>
      </div>

      {/* TABLE */}
      <div className="auditTable">
        {loading ? (
          <div style={{ padding: 20 }}>Loading audit logs…</div>
        ) : events.length === 0 ? (
          <div style={{ padding: 20 }}>No events found.</div>
        ) : (
          events.map((e) => (
            <div key={e.id} className="auditRow">
              <div className="auditTime">
                {new Date(e.timestamp).toLocaleString()}
              </div>

              <div className="auditAction">
                {e.action}
              </div>

              <div className="auditActor">
                Actor: {e.actorId}
              </div>

              <div className="auditTarget">
                Target: {e.targetType || "-"} ({e.targetId || "-"})
              </div>
            </div>
          ))
        )}
      </div>

      {/* PAGINATION */}
      <div className="paginationRow">
        <button
          className="btn"
          disabled={page <= 1}
          onClick={() => loadAudit(page - 1)}
        >
          Prev
        </button>

        <button
          className="btn"
          disabled={page >= pages}
          onClick={() => loadAudit(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
