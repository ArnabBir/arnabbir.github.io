import React from 'react';

export default class AppErrorBoundary extends React.Component {
  state = { failed: false, offline: navigator.onLine === false };

  static getDerivedStateFromError() { return { failed: true }; }

  updateConnection = () => this.setState({ offline: navigator.onLine === false });

  componentDidMount() {
    window.addEventListener('online', this.updateConnection);
    window.addEventListener('offline', this.updateConnection);
  }

  componentWillUnmount() {
    window.removeEventListener('online', this.updateConnection);
    window.removeEventListener('offline', this.updateConnection);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main id="content" role="alert" className="mx-auto max-w-xl px-6 py-24">
        <h1 className="text-3xl font-bold">This page could not be loaded</h1>
        <p className="my-6">
          {this.state.offline
            ? 'You are offline. Reconnect, then reload this page to try again.'
            : 'The site may have been updated, or a network request failed. Reload to try again. Your current address will be preserved.'}
        </p>
        <button type="button" className="rounded border px-4 py-2 disabled:opacity-50"
          disabled={this.state.offline}
          onClick={() => { if (navigator.onLine !== false) window.location.reload(); }}>
          Reload this page
        </button>
        <a href="/" className="ml-6 underline">Go to homepage</a>
      </main>
    );
  }
}
