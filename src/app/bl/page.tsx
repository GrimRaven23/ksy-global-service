import { Suspense } from "react";
import BLEditor from "@/components/BLEditor";

export default function BLPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-txt2">Chargement...</div>}>
      <BLEditor />
    </Suspense>
  );
}
