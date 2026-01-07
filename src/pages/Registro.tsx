import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/layout/WhatsAppButton";
import RegistrationFormSection from "@/components/sections/RegistrationFormSection";

const Registro = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        <RegistrationFormSection />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Registro;
