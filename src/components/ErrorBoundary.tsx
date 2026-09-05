import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.href = '/';
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#090514] text-white flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-[#150f26] border border-purple-800/40 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">
                Sahifani yuklashda xatolik yuz berdi
              </h1>
              <p className="text-sm text-purple-300/70 leading-relaxed">
                Ilovada kutilmagan nosozlik yuz berdi. Iltimos, sahifani yangilang yoki qayta kiring.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-[#0b0618] rounded-xl p-3 text-left border border-purple-900/30 overflow-x-auto text-xs text-red-300/80 font-mono">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-900/40 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Sahifani yangilash</span>
              </button>

              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1e1438] hover:bg-[#281a4b] text-purple-200 border border-purple-700/30 font-semibold text-sm transition-all cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Qayta urinish</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
