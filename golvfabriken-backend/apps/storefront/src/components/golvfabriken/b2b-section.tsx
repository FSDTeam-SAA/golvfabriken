import { Link } from "@tanstack/react-router";
import { BuildingOffice, Calculator, Truck } from "@/components/icons/custom-icons";

export function B2BSection() {
  return (
    <section className="py-16 md:py-24 bg-golvfabriken-sand-100">
      <div className="content-container">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="mb-4">Företag & Projekt</h2>
            <p className="text-body-lg mb-6 text-golvfabriken-graphite/80">
              Vi hjälper byggföretag, fastighetsägare och bostadsrättsföreningar med allt från mindre renoveringar till stora projekt.
            </p>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-golvfabriken-green/10 flex items-center justify-center flex-shrink-0">
                  <BuildingOffice className="w-5 h-5 text-golvfabriken-green" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Volymrabatter</h4>
                  <p className="text-body-sm text-golvfabriken-graphite/70">
                    Konkurrenskraftiga priser för stora beställningar
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-golvfabriken-green/10 flex items-center justify-center flex-shrink-0">
                  <Calculator className="w-5 h-5 text-golvfabriken-green" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Offertförfrågan</h4>
                  <p className="text-body-sm text-golvfabriken-graphite/70">
                    Få skräddarsydd offert inom 24 timmar
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-golvfabriken-green/10 flex items-center justify-center flex-shrink-0">
                  <Truck className="w-5 h-5 text-golvfabriken-green" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Flexibel leverans</h4>
                  <p className="text-body-sm text-golvfabriken-graphite/70">
                    Anpassad leverans direkt till byggplatsen
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="#" className="btn-primary text-center">
                Begär offert
              </a>
              <a href="#" className="btn-secondary text-center">
                Läs mer om B2B
              </a>
            </div>
          </div>
          
          <div className="relative aspect-[4/3] rounded-gf overflow-hidden shadow-gf-lg">
            <img
              src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800"
              alt="Byggprojekt med golv"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
