import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Sales - SmartStock",
    description: "Track your inventory sales."
}

export default function SignInLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}