import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  params: Promise<{
    id: string;
  }>;
}

export default async function Layout({ children, params }: LayoutProps) {
  const { id } = await params;
  
  return (
    <div data-announcement-id={id}>
      {children}
    </div>
  );
} 