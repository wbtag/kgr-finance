import '@yaireo/tagify/dist/tagify.css';
import "./globals.css";
import React from "react";

// export const metadata = {
//   title: "Kongregerace",
//   description: "",
// };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=1024" />
      </head>
      <body style={{backgroundColor: '#09002f'}}>
        {children}
      </body>
    </html>
  );
}