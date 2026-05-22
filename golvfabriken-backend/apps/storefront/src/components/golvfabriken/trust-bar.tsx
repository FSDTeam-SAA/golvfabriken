import { Phone } from "@medusajs/icons";
import { Truck, Shield, Award } from "@/components/icons/custom-icons";

interface TrustItem {
  icon: "truck" | "shield" | "phone" | "award";
  title: string;
  description: string;
}

const iconMap = {
  truck: Truck,
  shield: Shield,
  phone: Phone,
  award: Award,
};

interface TrustBarProps {
  items: TrustItem[];
}

export function TrustBar({ items }: TrustBarProps) {
  return (
    <section className="bg-white py-12 border-y border-golvfabriken-beige-200">
      <div className="content-container">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {items.map((item, index) => {
            const Icon = iconMap[item.icon];
            return (
              <div key={index} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-golvfabriken-green/10 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-golvfabriken-green" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">{item.title}</h4>
                  <p className="text-body-sm text-golvfabriken-graphite/70">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
