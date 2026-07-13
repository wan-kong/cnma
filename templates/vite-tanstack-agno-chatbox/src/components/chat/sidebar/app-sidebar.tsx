"use client";

import { useCallback, useMemo, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSessionContext } from "@/components/provider/session-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { FixedSidebarHeader } from "./fixed-sidebar-header";
import { CreateNewSession } from "./new-session-button";
import { SessionListItem } from "./session-list-item";

export function AppSidebar() {
  const {
    sessionList,
    currentSessionId,
    handleRenameSession,
    handleDeleteSession,
    handleNewSession,
    handleSelectSession,
  } = useSessionContext();
  const { open: sidebarOpen } = useSidebar();
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameSessionId, setRenameSessionId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameLoading, setRenameLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filteredSessions = sessionList ?? [];

  const renameTarget = useMemo(() => {
    if (!renameSessionId) {
      return null;
    }
    return filteredSessions.find((s) => s.session_id === renameSessionId) ?? null;
  }, [renameSessionId, filteredSessions]);

  const deleteTarget = useMemo(() => {
    if (!deleteSessionId) {
      return null;
    }
    return filteredSessions.find((s) => s.session_id === deleteSessionId) ?? null;
  }, [deleteSessionId, filteredSessions]);

  const openRename = useCallback(
    (sessionId: string) => {
      const session = filteredSessions.find((s) => s.session_id === sessionId);
      if (!session) {
        return;
      }
      setRenameSessionId(sessionId);
      setRenameValue(session.session_name);
      setRenameOpen(true);
    },
    [filteredSessions],
  );

  const openDelete = useCallback((sessionId: string) => {
    setDeleteSessionId(sessionId);
    setDeleteOpen(true);
  }, []);

  const submitRename = useCallback(async () => {
    if (!renameSessionId) {
      return;
    }
    const nextName = renameValue.trim();
    if (!nextName) {
      return;
    }
    try {
      setRenameLoading(true);
      await handleRenameSession(renameSessionId, nextName);
      setRenameOpen(false);
    } finally {
      setRenameLoading(false);
    }
  }, [renameSessionId, renameValue, handleRenameSession]);

  const confirmDelete = useCallback(async () => {
    if (!deleteSessionId) {
      return;
    }
    try {
      setDeleteLoading(true);
      await handleDeleteSession(deleteSessionId);
      setDeleteOpen(false);
      setDeleteSessionId(null);
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteSessionId, handleDeleteSession]);

  return (
    <Sidebar variant="floating">
      <SidebarHeader className="mt-10">
        <CreateNewSession handleNewConversation={handleNewSession} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="pt-0">
          <SidebarGroupLabel>会话列表</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredSessions.map((session) => {
                const isActive = currentSessionId === session.session_id;
                return (
                  <SessionListItem
                    key={session.session_id}
                    session={session}
                    isActive={isActive}
                    onRenameAction={openRename}
                    onDeleteAction={openDelete}
                    onSelectAction={handleSelectSession}
                  />
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex justify-end">
          <ThemeToggle />
        </div>
      </SidebarFooter>
      <SidebarRail />
      <FixedSidebarHeader open={sidebarOpen} />
      <Dialog
        open={renameOpen}
        onOpenChange={(nextOpen) => {
          setRenameOpen(nextOpen);
          if (!nextOpen) {
            setRenameSessionId(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重命名</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder={renameTarget?.session_name ?? "Session name"}
          />
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setRenameOpen(false);
              }}
              disabled={renameLoading}
            >
              取消
            </Button>
            <Button
              onClick={() => void submitRename()}
              disabled={!renameValue.trim() || renameLoading}
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={deleteOpen}
        onOpenChange={(nextOpen) => {
          setDeleteOpen(nextOpen);
          if (!nextOpen) {
            setDeleteSessionId(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除会话</DialogTitle>
            <DialogDescription>
              要删除 &ldquo;{deleteTarget?.session_name ?? "this session"}
              &rdquo;吗? 该操作将永久删除会话，无法恢复。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)} disabled={deleteLoading}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => void confirmDelete()}
              disabled={deleteLoading}
            >
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sidebar>
  );
}
