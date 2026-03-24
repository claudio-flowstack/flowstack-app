import { useState, useEffect, useCallback } from "react";
import { SidebarProvider, useSidebar } from "../contexts/SidebarContext";
import { Outlet } from "react-router-dom";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";
import NotificationToast from "../components/NotificationToast";
import { CommandPalette } from "../components/CommandPalette";

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);

  // Cmd+K / Ctrl+K hotkey
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const closePalette = useCallback(() => setCmdPaletteOpen(false), []);

  return (
    <div className="min-h-screen xl:flex overflow-x-hidden">
      <div>
        <AppSidebar />
        <Backdrop />
      </div>
      <div
        className={`flex-1 overflow-x-hidden transition-all duration-300 ease-in-out ${
          isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]"
        } ${isMobileOpen ? "ml-0" : ""}`}
      >
        <AppHeader />
        <div className="p-4 md:p-6 w-full max-w-full overflow-x-hidden">
          <Outlet />
        </div>
      </div>
      <NotificationToast />
      <CommandPalette isOpen={cmdPaletteOpen} onClose={closePalette} />
    </div>
  );
};

const AppLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default AppLayout;
