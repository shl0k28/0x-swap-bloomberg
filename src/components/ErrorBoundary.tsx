import type { ReactNode } from 'react';
import React from 'react';
import { Box, Button } from '@chakra-ui/react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

/**
 * Class-based render error boundary for isolating tab crashes.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  public override render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <Box p="16px" fontFamily="mono" fontSize="11px" color="red">
            [RENDER ERROR] {this.state.error?.message}
            <Button
              mt="8px"
              size="sm"
              variant="outline"
              onClick={() => this.setState({ hasError: false, error: undefined })}
            >
              RETRY
            </Button>
          </Box>
        )
      );
    }

    return this.props.children;
  }
}
