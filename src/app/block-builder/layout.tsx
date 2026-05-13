import "./builder.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Block Builder — Payload CMS",
};

export default function BlockBuilderLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, height: "100vh", overflow: "hidden" }}>
        {children}
      </body>
    </html>
  );
}
