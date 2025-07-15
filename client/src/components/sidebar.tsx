import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BarChart3, Users, Settings, X, UserCog } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "profiles", label: "Profile Section", icon: Users },
  { id: "profile-management", label: "Profile Management", icon: UserCog },
  { id: "settings", label: "Settings", icon: Settings },
];

export function Sidebar({ isOpen, onClose, activeSection, onSectionChange }: SidebarProps) {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 z-50",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "lg:relative lg:translate-x-0 lg:z-auto"
        )}
      >
        <div className="p-4 border-b lg:hidden">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Menu</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <nav className="mt-8">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSectionChange(item.id);
                  onClose(); // Close sidebar on mobile after selection
                }}
                className={cn(
                  "w-full flex items-center px-6 py-3 text-left transition-colors duration-200",
                  isActive
                    ? "text-[hsl(225,73%,57%)] bg-[hsl(225,73%,97%)] border-r-4 border-[hsl(225,73%,57%)]"
                    : "text-gray-600 hover:text-[hsl(225,73%,57%)] hover:bg-[hsl(225,73%,97%)]"
                )}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
