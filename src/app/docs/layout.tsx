import { Footer, Layout, Link, Navbar } from "nextra-theme-docs";
import { getPageMap } from "nextra/page-map";
import "nextra-theme-docs/style.css";
import { Hexagon } from "lucide-react";

const navbar = (
  <Navbar
    logo={
      <span className="flex gap-2 items-center">
        <Hexagon className="h-9 w-9" />
        <Link
          href="/dashboard"
          className="text-lg font-semibold tracking-tight"
        >
          uptime
        </Link>
      </span>
    }
  />
);
const footer = <Footer>{new Date().getFullYear()} © Uptime.</Footer>;

export default async function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pageMap = await getPageMap();

  const filteredPageMap = pageMap.filter((page) => {
    if ("route" in page && typeof page.route === "string") {
      return page.route.startsWith("/docs") || page.route === "/docs";
    }
    return false;
  });

  return (
    <Layout navbar={navbar} pageMap={filteredPageMap} footer={footer}>
      {children}
    </Layout>
  );
}
