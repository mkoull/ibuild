import { Component } from "react";
import _ from "../theme/tokens.js";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    if (import.meta.env.DEV) {
      console.error(`[ErrorBoundary:${this.props.level || "unknown"}]`, error, errorInfo);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleDashboard = () => {
    window.location.href = "/dashboard";
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const isDev = import.meta.env.DEV;
    const level = this.props.level || "app";
    const errorMessage = this.state.error?.message || this.state.error?.toString?.() || "Unknown error";

    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: level === "app" ? "100vh" : 400,
        padding: _.s7,
        background: _.bg,
      }}>
        <div style={{
          maxWidth: 520,
          width: "100%",
          background: _.surface,
          borderRadius: _.r,
          boxShadow: _.sh2,
          padding: _.s7,
          textAlign: "center",
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: _.rFull,
            background: "#fef2f2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            fontSize: 24,
          }}>!</div>

          <h2 style={{
            fontSize: _.fontSize.xl,
            fontWeight: _.fontWeight.bold,
            color: _.ink,
            marginBottom: _.s2,
          }}>
            Something went wrong
          </h2>

          <p style={{
            fontSize: _.fontSize.base,
            color: _.muted,
            marginBottom: _.s5,
            lineHeight: _.lineHeight.body,
          }}>
            {level === "project"
              ? "This page encountered an error. Your other projects are unaffected."
              : "The application encountered an unexpected error."}
          </p>

          <div style={{
            textAlign: "left",
            background: _.well,
            borderRadius: _.rSm,
            padding: _.s3,
            marginBottom: _.s4,
          }}>
            <div style={{
              fontSize: _.fontSize.xs,
              fontWeight: _.fontWeight.semi,
              color: _.muted,
              marginBottom: _.s1,
              letterSpacing: _.letterSpacing.wide,
              textTransform: "uppercase",
            }}>
              Error Message
            </div>
            <div style={{ fontSize: _.fontSize.sm, color: _.body, wordBreak: "break-word" }}>
              {errorMessage}
            </div>
          </div>

          {isDev && this.state.error && (
            <div style={{
              textAlign: "left",
              background: _.well,
              borderRadius: _.rSm,
              padding: _.s4,
              marginBottom: _.s5,
              overflow: "auto",
              maxHeight: 200,
            }}>
              <div style={{
                fontSize: _.fontSize.xs,
                fontWeight: _.fontWeight.semi,
                color: _.red,
                marginBottom: _.s2,
                letterSpacing: _.letterSpacing.wide,
                textTransform: "uppercase",
              }}>Error</div>
              <pre style={{
                fontSize: _.fontSize.xs,
                color: _.body,
                margin: 0,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                fontFamily: "monospace",
              }}>
                {this.state.error.toString()}
                {"\n"}
                {this.state.error.stack}
                {this.state.errorInfo?.componentStack}
              </pre>
            </div>
          )}

          <div style={{ display: "flex", gap: _.s3, justifyContent: "center" }}>
            {level === "project" && (
              <button
                onClick={this.handleRetry}
                style={{
                  padding: `${_.s2}px ${_.s5}px`,
                  borderRadius: _.rSm,
                  border: `1px solid ${_.line}`,
                  background: _.surface,
                  color: _.body,
                  fontSize: _.fontSize.base,
                  fontWeight: _.fontWeight.medium,
                  cursor: "pointer",
                  transition: _.tr,
                }}
              >
                Try Again
              </button>
            )}
            <button
              onClick={this.handleDashboard}
              style={{
                padding: `${_.s2}px ${_.s5}px`,
                borderRadius: _.rSm,
                border: `1px solid ${_.line}`,
                background: _.surface,
                color: _.body,
                fontSize: _.fontSize.base,
                fontWeight: _.fontWeight.medium,
                cursor: "pointer",
                transition: _.tr,
              }}
            >
              Go to Dashboard
            </button>
            <button
              onClick={this.handleReload}
              style={{
                padding: `${_.s2}px ${_.s5}px`,
                borderRadius: _.rSm,
                border: "none",
                background: _.ac,
                color: "#fff",
                fontSize: _.fontSize.base,
                fontWeight: _.fontWeight.medium,
                cursor: "pointer",
                transition: _.tr,
              }}
            >
              Reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}
