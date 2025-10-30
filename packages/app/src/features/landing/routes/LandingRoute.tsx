import { FooterSection } from "@features/landing/components/FooterSection";
import { HeroSection } from "@features/landing/components/HeroSection";
import { PrinciplesSection } from "@features/landing/components/PrinciplesSection";
import { ProblemSection } from "@features/landing/components/ProblemSection";
import { SolutionSection } from "@features/landing/components/SolutionSection";
import { StepsSection } from "@features/landing/components/StepsSection";
import { AppHeader } from "@shared/ui/AppHeader";
import { ToastContainer } from "@shared/ui/ToastContainer";
import { useNavigate } from "react-router-dom";

export function LandingRoute() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <AppHeader />

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <HeroSection onCTA={() => navigate("/signin")} />
        <ProblemSection />
        <SolutionSection />
        <StepsSection />
        <PrinciplesSection />
      </main>

      {/* Footer */}
      <FooterSection />

      <ToastContainer />
    </div>
  );
}
