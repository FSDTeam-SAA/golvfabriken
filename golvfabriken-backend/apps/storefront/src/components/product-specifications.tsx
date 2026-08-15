import { ChevronDown } from "@medusajs/icons"
import { useState } from "react"
import { clsx } from "clsx"

interface Specification {
  label: string
  value: string
}

interface SpecificationGroup {
  title: string
  specs: Specification[]
}

interface ProductSpecificationsProps {
  metadata?: Record<string, any>
  product?: {
    material?: string
    weight?: number
    length?: number
    width?: number
    height?: number
  }
}

export function ProductSpecifications({ metadata, product }: ProductSpecificationsProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    general: true,
  })

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // Build specifications from actual backend data
  const buildSpecifications = (): SpecificationGroup[] => {
    const groups: SpecificationGroup[] = []

    // General information
    const generalSpecs: Specification[] = []
    if (metadata?.unit) generalSpecs.push({ label: "Enhet", value: metadata.unit })
    if (metadata?.thickness) generalSpecs.push({ label: "Tjocklek", value: metadata.thickness })
    if (metadata?.wear_class) generalSpecs.push({ label: "Slitklass", value: metadata.wear_class })
    if (product?.material) generalSpecs.push({ label: "Material", value: product.material })
    if (product?.weight) generalSpecs.push({ label: "Vikt", value: `${product.weight} kg` })
    
    if (generalSpecs.length > 0) {
      groups.push({ title: "Allmän information", specs: generalSpecs })
    }

    // Dimensions
    const dimensionSpecs: Specification[] = []
    if (product?.length) dimensionSpecs.push({ label: "Längd", value: `${product.length} mm` })
    if (product?.width) dimensionSpecs.push({ label: "Bredd", value: `${product.width} mm` })
    if (product?.height) dimensionSpecs.push({ label: "Höjd", value: `${product.height} mm` })
    if (metadata?.package_size) dimensionSpecs.push({ label: "Förpackning", value: metadata.package_size })
    
    if (dimensionSpecs.length > 0) {
      groups.push({ title: "Dimensioner", specs: dimensionSpecs })
    }

    // Installation
    const installationSpecs: Specification[] = []
    if (metadata?.installation) installationSpecs.push({ label: "Läggningssätt", value: metadata.installation })
    if (metadata?.installation_method) installationSpecs.push({ label: "Installationsmetod", value: metadata.installation_method })
    if (metadata?.acclimation_time) installationSpecs.push({ label: "Acklimatiseringstid", value: metadata.acclimation_time })
    if (metadata?.required_accessories) installationSpecs.push({ label: "Tillbehör som krävs", value: metadata.required_accessories })
    
    if (installationSpecs.length > 0) {
      groups.push({ title: "Installation", specs: installationSpecs })
    }

    // Additional properties from metadata
    const additionalSpecs: Specification[] = []
    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        // Skip already displayed fields
        if (['unit', 'thickness', 'wear_class', 'installation', 'installation_method', 
             'package_size', 'acclimation_time', 'required_accessories'].includes(key)) {
          return
        }
        
        // Format the key to be more readable
        const label = key
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
        
        additionalSpecs.push({ label, value: String(value) })
      })
    }
    
    if (additionalSpecs.length > 0) {
      groups.push({ title: "Övriga egenskaper", specs: additionalSpecs })
    }

    return groups
  }

  const specifications = buildSpecifications()

  // Show message if no specifications available
  if (specifications.length === 0) {
    return (
      <div className="border border-golvfabriken-graphite/20 rounded-lg p-6 text-center">
        <p className="text-golvfabriken-graphite/50">Inga specifikationer tillgängliga</p>
      </div>
    )
  }

  return (
    <div className="border border-golvfabriken-graphite/20 rounded-lg overflow-hidden">
      {specifications.map((group, index) => (
        <div key={group.title} className={clsx("border-b border-golvfabriken-graphite/20 last:border-b-0")}>
          <button
            onClick={() => toggleSection(group.title.toLowerCase().replace(/\s+/g, '-'))}
            className="w-full flex items-center justify-between p-4 hover:bg-golvfabriken-beige-100 transition-colors"
          >
            <h3 className="text-lg font-semibold text-golvfabriken-graphite">{group.title}</h3>
            <ChevronDown 
              className={clsx(
                "w-5 h-5 text-golvfabriken-graphite transition-transform",
                openSections[group.title.toLowerCase().replace(/\s+/g, '-')] && "rotate-180"
              )}
            />
          </button>
          
          {openSections[group.title.toLowerCase().replace(/\s+/g, '-')] && (
            <div className="px-4 pb-4">
              <table className="w-full">
                <tbody>
                  {group.specs.map((spec, specIndex) => (
                    <tr
                      key={spec.label}
                      className={clsx(
                        "border-t border-golvfabriken-graphite/10",
                        specIndex === 0 && "border-t-0"
                      )}
                    >
                      <td className="py-2 pr-4 text-sm text-golvfabriken-graphite/70 w-1/2">
                        {spec.label}
                      </td>
                      <td className="py-2 text-sm font-medium text-golvfabriken-graphite">
                        {spec.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
