import { ThemeProvider } from "@/components/provider/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TanstackQueryInitializer } from "@/lib/tanstack-query-initializer";
import { createRootRoute, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <TanstackQueryInitializer>
          <Outlet />
        </TanstackQueryInitializer>
      </ThemeProvider>
      <Toaster position="top-center" />
    </>
  );
}
