declare module 'react-window' {
  import type { ComponentType, CSSProperties, ReactNode } from 'react';

  export interface ListChildComponentProps<TData = unknown> {
    index: number;
    style: CSSProperties;
    data: TData;
    isScrolling?: boolean;
  }

  export interface FixedSizeListProps<TData = unknown> {
    children: ComponentType<ListChildComponentProps<TData>>;
    className?: string;
    height: number;
    itemCount: number;
    itemData: TData;
    itemSize: number;
    overscanCount?: number;
    width: number | string;
  }

  export function FixedSizeList<TData = unknown>(
    props: FixedSizeListProps<TData>,
  ): ReactNode;
}
