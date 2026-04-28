import { Outlet } from 'react-router-dom';
import Sidebar from './sidebar';

export function Layout() {
  return (
    <div className="dark h-screen bg-background flex overflow-hidden">
      {/* Background gradient effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#10b981] opacity-5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-[#ff8a80] opacity-5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/3 w-96 h-96 bg-[#60a5fa] opacity-5 rounded-full blur-3xl" />
      </div>

      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-auto relative">
        <div className="flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}