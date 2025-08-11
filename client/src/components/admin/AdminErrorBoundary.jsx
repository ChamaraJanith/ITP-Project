import React from 'react';

class AdminErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Admin Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          background: '#fee',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            maxWidth: '600px'
          }}>
            <h2 style={{ color: '#dc3545', marginBottom: '1rem' }}>
              ⚠️ Admin Portal Error
            </h2>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>
              Something went wrong in the admin portal. Please try refreshing the page or contact support.
            </p>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                onClick={() => window.location.reload()} 
                style={{
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                🔄 Refresh Page
              </button>
              
              <button 
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/admin/login';
                }} 
                style={{
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                🔑 Re-login
              </button>
              
              <button 
                onClick={() => window.location.href = '/'} 
                style={{
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                🏠 Go Home
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{ marginTop: '2rem', textAlign: 'left' }}>
                <summary style={{ cursor: 'pointer', color: '#667eea' }}>
                  🔍 Debug Information
                </summary>
                <pre style={{
                  background: '#f8f9fa',
                  padding: '1rem',
                  borderRadius: '4px',
                  overflow: 'auto',
                  fontSize: '12px',
                  marginTop: '1rem'
                }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AdminErrorBoundary;
