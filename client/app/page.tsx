import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ProblemSolution from "@/components/ProblemSolution";
import CoreFeatures from "@/components/CoreFeatures";
import TechArchitecture from "@/components/TechArchitecture";
import UseCasesTabs from "@/components/UseCasesTabs";
import CtaBanner from "@/components/CtaBanner";
import Footer from "@/components/Footer";

export default function HomePage() {
  return (
    <>
      {/* Fixed top navigation */}
      <Navbar />

      <main>
        {/* Hero — value prop + code/chat preview */}
        <HeroSection />

        {/* Problem vs Solution */}
        <ProblemSolution />

        {/* Core Features — 3-column */}
        <CoreFeatures />

        {/* Technical Architecture stack */}
        <TechArchitecture />

        {/* Interactive Use-Cases Tabs */}
        <UseCasesTabs />

        {/* Final CTA */}
        <CtaBanner />
      </main>

      {/* Site footer */}
      <Footer />
    </>
  );
}
