"use client";

import { ReactNode } from 'react';
import dynamic from 'next/dynamic';

// Only import R3F components on client side
const R3FCanvas = dynamic(
  () => import('./canvas').then((mod) => mod.default),
  { ssr: false }
);

export default function R3FProvider({
  children,
}: {
  children: ReactNode;
}) {
  return <R3FCanvas>{children}</R3FCanvas>;
}