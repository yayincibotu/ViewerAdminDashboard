import React from 'react';

interface HeadProps {
  children?: React.ReactNode;
}

const Head: React.FC<HeadProps> = ({ children }) => {
  // This is a placeholder component that only renders children
  // In a real Next.js app, this would be the actual Next.js Head component
  return <>{children}</>;
};

export default Head;