import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export const FixedSidebarHeader = ({ open }: { open: boolean }) => {
  return (
    <div
      className={cn(
        "fixed top-2 left-0 z-20 flex w-(--sidebar-width) items-center gap-2 px-5 py-2 pt-3",
        open ? "justify-between" : "justify-start",
      )}
    >
      <span>Agno Chat</span>
      <SidebarTrigger className={cn("transition-all")}></SidebarTrigger>
    </div>
  );
};
