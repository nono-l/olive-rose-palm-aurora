import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { AbsorbGame } from "@/components/game/AbsorbGame";

export const Route = createFileRoute("/")({
  component: IndexPage,
  ssr: false,
});

function IndexPage() {
  return (
    <ClientOnly fallback={<div className="absorb-game-root map-bg" style={{display:'flex',alignItems:'center',justifyContent:'center',color:'#fff'}}>よみこみ中…</div>}>
      <AbsorbGame />
    </ClientOnly>
  );
}
