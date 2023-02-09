import React from "react";
import Navbar from "./Navbar";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Navbar />
      <main className="px-6 md:px-24 mx-auto mt-2">{children}</main>
    </>
  );
};

export default Layout;
