import { HeroSection } from './sections/hero'
import { DomainSection } from './sections/domain'
import { DemoSection } from './sections/demo'
import { StackFooterSection } from './sections/stack-footer'

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <DomainSection />
      <DemoSection />
      <StackFooterSection />
    </>
  )
}
