import { ComponentPropsWithoutRef } from 'react'

export function LogoSpotify20(props: ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} {...props}>
      <path d="M10 0C4.477 0 0 4.477 0 10s4.477 10 10 10 10-4.478 10-10C19.984 4.484 15.517.016 10 0m4.6 14.454a.594.594 0 0 1-.81.225q-.02-.011-.04-.025c-2.35-1.454-5.3-1.75-8.8-.95a.618.618 0 1 1-.3-1.199c3.8-.851 7.1-.5 9.7 1.099a.6.6 0 0 1 .277.801q-.013.025-.027.049m1.205-2.754a.753.753 0 0 1-1.034.26l-.016-.01A12.96 12.96 0 0 0 4.8 10.8a.76.76 0 0 1-.455-1.45A14.63 14.63 0 0 1 15.6 10.7a.706.706 0 0 1 .216.975q-.006.012-.016.025m.1-2.8C12.7 7 7.35 6.8 4.3 7.75a.918.918 0 0 1-.617-1.728q.035-.012.071-.022c3.551-1.05 9.4-.85 13.1 1.35.45.267.605.843.35 1.3a1.05 1.05 0 0 1-1.3.25" />
    </svg>
  )
}