"use client";

import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-[200px] flex items-center justify-center p-6" role="alert">
          <div className="text-center max-w-sm">
            <div className="w-12 h-12 rounded-full bg-red/10 flex items-center justify-center mx-auto mb-3">
              <span className="text-red text-xl" aria-hidden="true">!</span>
            </div>
            <p className="text-sm font-semibold text-red mb-1">Une erreur est survenue</p>
            <p className="text-xs text-txt2 mb-4">
              {this.state.error?.message || "Erreur inconnue"}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 text-xs font-medium text-white bg-navy rounded-lg hover:bg-navy-l transition-colors cursor-pointer"
            >
              Réessayer
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
