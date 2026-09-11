"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <html lang="fr">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="max-w-md w-full text-center p-8">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Une erreur inattendue s&apos;est produite
            </h1>
            <p className="text-gray-600 mb-6">
              Veuillez réessayer ou contacter le support si le problème persiste.
            </p>
            <button
              onClick={reset}
              className="px-6 py-3 bg-[#0a1e3d] text-white rounded-lg font-medium hover:bg-[#132d54] transition-colors"
            >
              Recharger la page
            </button>
            {error.digest && (
              <p className="mt-4 text-xs text-gray-400">
                Référence: {error.digest}
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
