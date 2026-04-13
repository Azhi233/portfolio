import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      message: '',
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || 'Unknown render error',
    };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught error:', error, info);
  }

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-[#050507] px-6 text-zinc-100">
          <section className="w-full max-w-xl rounded-2xl border border-zinc-700 bg-zinc-950/80 p-6 text-center">
            <p className="text-xs tracking-[0.2em] text-zinc-500">RUNTIME ERROR</p>
            <h1 className="mt-2 font-serif text-2xl tracking-[0.08em] text-zinc-100">页面渲染出现异常</h1>
            <p className="mt-3 text-sm text-zinc-400">已阻止整页崩溃。你可以刷新页面继续操作。</p>
            <p className="mt-3 rounded-md border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-left text-xs text-zinc-300">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="mt-4 rounded-md border border-emerald-300/70 bg-emerald-300/10 px-4 py-2 text-xs tracking-[0.12em] text-emerald-200"
            >
              刷新页面
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
