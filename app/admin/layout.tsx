import { notFound } from "next/navigation";
import { getServerLang } from "@/lib/server-lang";
import { getAdmin } from "@/lib/admin";
import { adminNavLinks } from "@/lib/admin-nav";
import { ui, subNavClass } from "@/components/ui";
import NavLink from "@/components/site/NavLink";

export const dynamic = "force-dynamic";

// Шелл адмінки: гейт «будь-який адмін», далі секції — за правами (гейт ще раз на кожній сторінці).
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdmin();
  if (!admin) notFound();
  const lang = getServerLang();
  const links = adminNavLinks(admin, lang).filter((l) => l.show);

  return (
    <div className={ui.pageStack}>
      <nav className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        {links.map((l) => (
          <NavLink
            key={l.href}
            href={l.href}
            className={subNavClass(false)}
            activeClassName={subNavClass(true)}
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
      {children}
    </div>
  );
}
