import Link from "next/link";
import { useRouter } from "next/router";

const navItems = [
  { href: "/people", label: "Neighbors" },
  { href: "/routes", label: "Routes" },
  { href: "/businesses", label: "Businesses" }
];

const Sidebar = () => {
  const router = useRouter();

  return (
    <aside className="hidden w-64 flex-shrink-0 border-r border-primary-200 bg-cream-100 lg:block">
      <div className="flex h-full flex-col">
        <div className="border-b border-primary-200 px-6 py-6">
          <span className="text-lg font-semibold text-primary-700">MLCC</span>
          <p className="text-sm text-neutral-600">Community Dashboard</p>
        </div>
        <nav className="flex-1 px-4 py-6">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = router.pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary-700 text-white hover:bg-primary-800 hover:text-white"
                        : "text-neutral-700 hover:bg-primary-600 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="border-t border-primary-200 px-6 py-6 text-sm text-neutral-600">
          <p>Built for MLCC community coordinators.</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

