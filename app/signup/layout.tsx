import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Sign Up - SmartStock",
    description: "Create an account to get started."
}

export default function SignUpLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}