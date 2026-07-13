import { EllipsisIcon, MessageSquare, PencilIcon, Trash2Icon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuAction, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import type { AgnoSession } from "@/types/chat";

export function SessionListItem({
  session,
  isActive,
  onRenameAction,
  onDeleteAction,
  onSelectAction,
}: {
  session: AgnoSession;
  isActive: boolean;
  onRenameAction: (sessionId: string) => void;
  onDeleteAction: (sessionId: string) => void;
  onSelectAction: (sessionId: string) => void;
}) {
  return (
    <SidebarMenuItem key={session.session_id}>
      <SidebarMenuButton isActive={isActive} onClick={() => onSelectAction(session.session_id)}>
        <MessageSquare className="size-4" />
        <span>{session.session_name}</span>
      </SidebarMenuButton>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<SidebarMenuAction showOnHover onClick={(e) => e.stopPropagation()} />}
        >
          <EllipsisIcon className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => onRenameAction(session.session_id)}>
            <PencilIcon className="size-4" />
            <span>重命名</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => onDeleteAction(session.session_id)}
          >
            <Trash2Icon className="size-4" />
            <span>删除</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}
