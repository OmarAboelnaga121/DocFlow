import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ProblemSolution from "@/components/ProblemSolution";
import CoreFeatures from "@/components/CoreFeatures";
import TechArchitecture from "@/components/TechArchitecture";
import UseCasesTabs from "@/components/UseCasesTabs";
import CtaBanner from "@/components/CtaBanner";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";

export default function HomePage() {
  return (
    <>
      {/* Fixed top navigation */}
      <Navbar />

      <main>
        {/* Hero — value prop + code/chat preview */}
        <ScrollReveal>
          <HeroSection />
        </ScrollReveal>

        {/* Problem vs Solution */}
        <ScrollReveal>
          <ProblemSolution />
        </ScrollReveal>

        {/* Core Features — 3-column */}
        <ScrollReveal>
          <CoreFeatures />
        </ScrollReveal>

        {/* Technical Architecture stack */}
        <ScrollReveal>
          <TechArchitecture />
        </ScrollReveal>

        {/* Interactive Use-Cases Tabs */}
        <ScrollReveal>
          <UseCasesTabs />
        </ScrollReveal>

        {/* Final CTA */}
        <ScrollReveal>
          <CtaBanner />
        </ScrollReveal>
      </main>

      {/* Site footer */}
      <Footer />
    </>
  );
}
