import { MatchDetailClient } from "./match-detail-client";

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MatchDetailClient matchId={id} />;
}
