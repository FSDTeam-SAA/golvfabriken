import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { OPS_MODULE } from "../../../../../modules/ops";
import OpsModuleService from "../../../../../modules/ops/service";
import { validateOpsAdminSecret } from "../../utils/admin-auth";

type TaxQuotePayload = {
  destination_country?: string;
  destination_region?: string;
  customer_type?: "b2c" | "b2b";
  customer_vat_id?: string;
  currency_code?: string;
  merchant_country_code?: string;
  lines?: Array<{
    sku?: string;
    title?: string;
    quantity?: number;
    unit_price?: number;
    discount_amount?: number;
    tax_rate?: number;
  }>;
};

export async function POST(req: MedusaRequest<TaxQuotePayload>, res: MedusaResponse) {
  const auth = validateOpsAdminSecret(req);

  if (!auth.valid) {
    res.status(401).json({
      message: auth.reason,
    });
    return;
  }

  const payload = req.body || {};

  if (!payload.destination_country) {
    res.status(400).json({
      message: "destination_country is required",
    });
    return;
  }

  const lines = Array.isArray(payload.lines) ? payload.lines : [];

  if (!lines.length) {
    res.status(400).json({
      message: "lines is required",
    });
    return;
  }

  const opsService: OpsModuleService = req.scope.resolve(OPS_MODULE);
  const quote = await opsService.calculateTaxQuotePreview({
    destination_country: String(payload.destination_country),
    destination_region: payload.destination_region,
    customer_type: payload.customer_type || "b2c",
    customer_vat_id: payload.customer_vat_id,
    currency_code: payload.currency_code,
    merchant_country_code: payload.merchant_country_code,
    lines: lines.map((line) => ({
      sku: line.sku,
      title: line.title,
      quantity: Number(line.quantity) || 0,
      unit_price: Number(line.unit_price) || 0,
      discount_amount: Number(line.discount_amount) || 0,
      tax_rate: line.tax_rate === undefined ? undefined : Number(line.tax_rate),
    })),
  });

  res.status(200).json({
    status: "ok",
    quote,
  });
}
