import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('Error boundary caught:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background text-white px-6 text-center">
          <h1 className="text-2xl font-semibold mb-3">Something went wrong.</h1>
          <p className="text-white/70 mb-6">Try reloading the page to continue.</p>
          <button
            onClick={this.handleReload}
            className="px-4 py-2 rounded bg-accent text-black font-semibold hover:bg-accent/90 transition-colors"
          >
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
