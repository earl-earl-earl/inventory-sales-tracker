import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Reports - SmartStock",
    description: "View and export inventory and sales reports."
}

export default function SignInLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}