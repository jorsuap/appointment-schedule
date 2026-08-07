'use client';

import { Switch as SwitchPrimitive } from '@base-ui/react/switch';

import { cn } from '@/lib/utils';

function Switch({
  className,
  ...props
}: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'peer relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-input bg-input/30 transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-checked:bg-primary data-checked:border-primary',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block size-5 rounded-full bg-white shadow-sm ring-0 transition-transform translate-x-0.5 [[data-checked]>&]:translate-x-[22px]"
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
