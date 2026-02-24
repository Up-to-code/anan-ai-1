"use client";

import React from "react";

interface State {
  hasError: boolean;
}

export class AgentChatErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full p-8">
          <p className="text-destructive">Something went wrong. Please refresh.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
