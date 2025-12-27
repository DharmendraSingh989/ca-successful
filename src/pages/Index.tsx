import Layout from "@/components/layout/Layout";
import OfferBanner from "@/components/home/OfferBanner";
import HeroSection from "@/components/home/HeroSection";
import StatsSection from "@/components/home/StatsSection";
import ServicesSection from "@/components/home/ServicesSection";
import CoursesSection from "@/components/home/CoursesSection";
import YoutubeSection from "@/components/home/YoutubeSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";

const Index = () => {
  return (
    <Layout>
      <OfferBanner />
      <HeroSection />
      <StatsSection />
      <ServicesSection />
      <CoursesSection />
      <YoutubeSection />
      <TestimonialsSection />
    </Layout>
  );
};

export default Index;
