import { ComingSoon, comingSoonMetadata } from "@/components/coming-soon";

export const generateMetadata = () => comingSoonMetadata("privacy");

export default function Page() {
  return <ComingSoon page="privacy" />;
}
