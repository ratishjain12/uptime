import type { ReactNode } from "react";

type ClientLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: ClientLayoutProps) {
  return <main>{children}</main>;
}