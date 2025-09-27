import { Hexagon, Github, Twitter } from "lucide-react";

import { Footer } from "@/components/ui/footer";

const AppFooter = () => {
  return (
    <Footer
      logo={<Hexagon className="h-9 w-9" />}
      brandName="uptime"
      socialLinks={[
        {
          icon: <Twitter className="h-5 w-5" />,
          href: "https://twitter.com",
          label: "Twitter",
        },
        {
          icon: <Github className="h-5 w-5" />,
          href: "https://github.com",
          label: "GitHub",
        },
      ]}
      copyright={{
        text: "© " + new Date().getFullYear() + " uptime",
        license: "All rights reserved.",
      }}
    />
  );
};

export default AppFooter;
