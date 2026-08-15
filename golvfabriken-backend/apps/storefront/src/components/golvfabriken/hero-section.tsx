import { Link } from "@tanstack/react-router";

interface HeroSectionProps {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  backgroundImage: string;
  secondaryCta?: {
    text: string;
    link: string;
  };
}

export function HeroSection({
  title,
  subtitle,
  ctaText,
  ctaLink,
  backgroundImage,
  secondaryCta,
}: HeroSectionProps) {
  return (
    <section className="relative h-[600px] md:h-[700px] w-full overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-black/20" />
      </div>

      <div className="content-container relative h-full flex items-center">
        <div className="max-w-2xl text-white">
          <h1 className="text-display md:text-[4rem] mb-4 text-white leading-tight">
            {title}
          </h1>
          <p className="text-body-lg md:text-xl mb-8 text-white/95">
            {subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to={ctaLink} className="btn-primary text-center">
              {ctaText}
            </Link>
            {secondaryCta && (
              <Link
                to={secondaryCta.link}
                className="btn-secondary text-center !text-[#2D5016] !border-white hover:!bg-white/10"
              >
                {secondaryCta.text}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
