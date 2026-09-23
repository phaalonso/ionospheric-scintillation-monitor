import React from "react";
import { AuthProvider } from "./auth";

const HooksProvider: React.FC = ({ children }) => {
    return <AuthProvider>{children}</AuthProvider>;
};

export default HooksProvider;
