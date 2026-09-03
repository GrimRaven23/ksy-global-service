import { Suspense } from "react";
import DocumentEditor from "@/components/DocumentEditor";

export default function DefinitivePage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-txt2">Chargement...</div>}>
      <DocumentEditor type="df" />
    </Suspense>
  );
}
