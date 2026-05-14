import React from 'react';

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export default class ErrorBoundary extends React.Component<{children: React.ReactNode}, State> {
  state: State = { hasError: false, error: null, errorInfo: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    console.error('[ErrorBoundary] React崩溃:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{padding:20, background:'#fee', color:'red', fontSize:14, fontFamily:'monospace'}}>
          <h2>页面崩溃了！</h2>
          <p><b>错误:</b> {this.state.error?.message}</p>
          <p><b>堆栈:</b></p>
          <pre style={{whiteSpace:'pre-wrap', fontSize:12}}>{this.state.errorInfo?.componentStack}</pre>
          <button onClick={() => window.location.reload()} style={{padding:'8px 16px', marginTop:10}}>刷新页面</button>
        </div>
      );
    }
    return this.props.children;
  }
}
