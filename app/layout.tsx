// app/layout.tsx
import "./global.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "F1GPT",
  description: "F1GPT is a chatbot that can answer your questions about Formula 1",
};

const RootLayout = ({ children }: { children: ReactNode }) => {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
};

export default RootLayout;
