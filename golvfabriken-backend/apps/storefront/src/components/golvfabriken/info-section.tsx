import { Link } from "@tanstack/react-router";
import { ChevronRight } from "@medusajs/icons";

interface InfoCard {
  title: string;
  description: string;
  imageUrl: string;
  link: string;
  linkText: string;
}

export function InfoSection() {
  const cards: InfoCard[] = [
    {
      title: "Golvguide",
      description: "Lär dig välja rätt golv för ditt hem. Vi guidar dig genom material, installation och underhåll.",
      imageUrl: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600",
      link: "/se",
      linkText: "Läs golvguiden",
    },
    {
      title: "Inspiration",
      description: "Hitta inspiration för ditt nästa golvprojekt. Se hur olika golv kan förändra ditt hem.",
      imageUrl: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600",
      link: "/se",
      linkText: "Se inspiration",
    },
    {
      title: "Installationsguide",
      description: "Steg-för-steg instruktioner för att lägga golv själv eller förstå vad hantverkaren gör.",
      imageUrl: "https://images.unsplash.com/photo-1615971677499-5467cbab01c0?w=600",
      link: "/se",
      linkText: "Läs guide",
    },
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="content-container">
        <div className="text-center mb-12">
          <h2 className="mb-4">Golvkunskap & Inspiration</h2>
          <p className="text-body-lg text-golvfabriken-graphite/70 max-w-2xl mx-auto">
            Utforska våra guider och hitta inspiration för ditt nästa projekt
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {cards.map((card, index) => (
            <article key={index} className="card-gf overflow-hidden group">
              <div className="aspect-[16/10] overflow-hidden bg-golvfabriken-beige-100">
                <img
                  src={card.imageUrl}
                  alt={card.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-6">
                <h3 className="text-h3 mb-3">{card.title}</h3>
                <p className="text-body text-golvfabriken-graphite/70 mb-4">
                  {card.description}
                </p>
                <Link
                  to={card.link}
                  className="btn-tertiary group-hover:gap-3 transition-all"
                >
                  {card.linkText}
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
