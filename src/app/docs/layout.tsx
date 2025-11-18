import { Footer, Layout, Navbar } from "nextra-theme-docs";
import { getPageMap } from "nextra/page-map";
import "nextra-theme-docs/style.css";

const navbar = (
  <Navbar
    logo={<b>Uptime</b>}
    // ... Your additional navbar options
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
