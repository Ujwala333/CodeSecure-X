"use client";

import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: "hsl(222,47%,10%)",
          color: "hsl(213,31%,91%)",
          border: "1px solid hsl(222,47%,18%)",
          borderRadius: "12px",
          fontSize: "14px",
        },
        success: {
          iconTheme: {
            primary: "hsl(142,71%,45%)",
            secondary: "hsl(222,47%,10%)",
          },
        },
        error: {
          iconTheme: {
            primary: "hsl(0,72%,51%)",
            secondary: "hsl(222,47%,10%)",
          },
        },
      }}
    />
  );
}
