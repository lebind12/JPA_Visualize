import { useEffect } from 'react'
import type { RefObject } from 'react'
import Lenis from 'lenis'

/**
 * Lenis 관성 스크롤을 특정 wrapper 요소에 부착한다.
 * CSS `scroll-snap-type`과 함께 쓸 때는 lerp를 낮게 두어 스냅 동작을 방해하지 않도록 한다.
 */
export function useLenis(wrapperRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return
    const content = (wrapper.firstElementChild as HTMLElement) ?? wrapper

    const lenis = new Lenis({
      wrapper,
      content,
      lerp: 0.08,
      smoothWheel: true,
      syncTouch: false,
    })

    let rafId = 0
    function raf(time: number) {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
    }
  }, [wrapperRef])
}
