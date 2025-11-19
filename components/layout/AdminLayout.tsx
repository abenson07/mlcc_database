import { ReactNode } from "react";
import Sidebar from "./Sidebar";

type AdminLayoutProps = {
  header?: ReactNode;
  children: ReactNode;
};

const AdminLayout = ({ header, children }: AdminLayoutProps) => {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        {header && (
          <header className="border-b border-primary-200 bg-cream-100">
            <div className="mx-auto w-full max-w-7xl px-6 py-6">{header}</div>
          </header>
        )}
        <main className="flex-1 bg-cream-100">
          <div className="mx-auto w-full max-w-7xl px-6 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

