// FR-504: Admin panel navigation header
import Link from "next/link";

export default function Header() {
  return (
    <header
      style={{
        backgroundColor: "#1a73e8",
        color: "#fff",
        padding: "12px 24px",
        display: "flex",
        alignItems: "center",
        gap: 32,
      }}
    >
      <Link
        href="/"
        style={{ color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 18 }}
      >
        Campus GPS Admin
      </Link>
      <nav style={{ display: "flex", gap: 20 }}>
        <Link href="/incidents" style={{ color: "#ddd", textDecoration: "none" }}>
          Incidencias
        </Link>
        <Link href="/segments" style={{ color: "#ddd", textDecoration: "none" }}>
          Segmentos
        </Link>
      </nav>
    </header>
  );
}
