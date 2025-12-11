import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Inventory - SmartStock",
    description: "Manage your inventory."
}

export default function SignInLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}