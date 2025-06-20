import { ReactNode, Suspense } from 'react';

type Props = {
  condition: () => Promise<boolean>;
  children: ReactNode;
  loadingFallback?: ReactNode;
  otherwise?: ReactNode;
};

export function AsyncIf({ condition, children, loadingFallback, otherwise }: Props) {
  return (
    <Suspense fallback={loadingFallback}>
      <SuspendedComponent condition={condition} otherwise={otherwise}>
        {children}
      </SuspendedComponent>
    </Suspense>
  );
}

async function SuspendedComponent({
  children,
  condition,
  otherwise = null,
}: Omit<Props, 'loadingFallback'>) {
  return (await condition()) ? children : otherwise;
}
