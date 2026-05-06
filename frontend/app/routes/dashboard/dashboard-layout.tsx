import { Header } from "@/components/layout/header";
import { SidebarComponent } from "@/components/layout/sidebar-component";
import { Button } from "@/components/ui/button";
import CreateWorkspace from "@/components/workspace/create-workspace";
import { fetchData } from "@/lib/fetch-util";
import { useAuth } from "@/provider/auth-context";
import type { Workspace } from "@/types";
import { Loader } from "lucide-react";
import { useState } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router";

export const clientLoader = async () => {
  try {
    const [workspaces] = await Promise.all([fetchData("/workspaces")]);
    return { workspaces };
  } catch (error) {
    console.log(error);
    return { workspaces: [] };
  }
};

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading, hasRole } = useAuth();
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(
    null,
  );
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  if (isLoading) {
    return <Loader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" />;
  }

  // Define cashier-only routes
  const cashierOnlyRoutes = [
    "/workspaces",
    "/my-tasks",
    "/backlog",
    "/members",
    "/wine-commission",
    "/cancel-report",
  ];

  // Check if current path requires cashier role
  const isCashierOnlyRoute = cashierOnlyRoutes.some(route => 
    location.pathname.startsWith(route)
  );

  if (isCashierOnlyRoute && !hasRole(["cashier", "admin"])) {
    // Redirect to dashboard if not authorized
    return <Navigate to="/dashboard" />;
  }

  const handleWorkspaceSelected = (workspace: Workspace) => {
    setCurrentWorkspace(workspace);
    navigate(`/workspaces/${workspace._id}`);
  };

  return (
    <div className="flex h-screen w-full">
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed md:static inset-y-0 left-0 z-40 transition-all duration-300 ${
          isMobileSidebarOpen ? "w-64" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <SidebarComponent
          currentWorkspace={currentWorkspace}
          onMobileMenuClose={() => setIsMobileSidebarOpen(false)}
        />
      </div>

      <div className="flex flex-1 flex-col h-full w-full">
        <Header
          onWorkspaceSelected={handleWorkspaceSelected}
          selectedWorkspace={currentWorkspace}
          onCreateWorkspace={() => setIsCreatingWorkspace(true)}
          onMobileMenuToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />

        <main className="flex-1 overflow-y-auto w-full h-full">
          <div className="mx-auto container px-2 sm:px-6 lg:px-8 py-0 md:py-8 w-full h-full">
            <Outlet />
          </div>
        </main>
      </div>

      <CreateWorkspace
        isCreatingWorkspace={isCreatingWorkspace}
        setIsCreatingWorkspace={setIsCreatingWorkspace}
      />
    </div>
  );
};

export default DashboardLayout;
