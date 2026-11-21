import { AppShell } from "@/components/AppShell";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AppShell allow={["family"]}>{children}</AppShell>;
}
