import { ComingSoon, comingSoonMetadata } from "@/components/coming-soon";

export const generateMetadata = () => comingSoonMetadata("imprint");

export default function Page() {
  return <ComingSoon page="imprint" />;
}
