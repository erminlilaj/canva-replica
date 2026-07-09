import { Component, type ErrorInfo, type ReactNode } from "react";
import { sq } from "../i18n/sq";

interface ErrorBoundaryProps {
  children: ReactNode;
  onReset: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <main className="error-screen">
        <h1>{sq.error.title}</h1>
        <p>{sq.error.body}</p>
        <button
          onClick={() => {
            this.setState({ hasError: false });
            this.props.onReset();
          }}
        >
          {sq.error.back}
        </button>
      </main>
    );
  }
}
